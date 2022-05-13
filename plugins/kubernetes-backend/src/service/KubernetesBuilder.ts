/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  CompoundEntityRef,
  parseEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { CatalogApi } from '@backstage/catalog-client';
import { InputError } from '@backstage/errors';
import { Config } from '@backstage/config';
import express, { Request } from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Duration } from 'luxon';
import { getCombinedClusterSupplier } from '../cluster-locator';
import { MultiTenantServiceLocator } from '../service-locator/MultiTenantServiceLocator';
import {
  ServiceLocatorMethod,
  KubernetesObjectsProvider,
  ObjectsByEntityRequest,
  KubernetesClustersSupplier,
  KubernetesFetcher,
  KubernetesServiceLocator,
  KubernetesObjectsProviderOptions,
} from '../types/types';
import {
  CustomResource,
  KubernetesObjectTypes,
} from '@backstage/plugin-kubernetes-common';
import { KubernetesClientProvider } from './KubernetesClientProvider';
import {
  DEFAULT_OBJECTS,
  KubernetesFanOutHandler,
} from './KubernetesFanOutHandler';
import { KubernetesClientBasedFetcher } from './KubernetesFetcher';

export interface KubernetesEnvironment {
  logger: Logger;
  config: Config;
  catalogApi: CatalogApi;
}

/**
 * The return type of the `KubernetesBuilder.build` method
 *
 * @public
 */
export type KubernetesBuilderReturn = Promise<{
  router: express.Router;
  clusterSupplier: KubernetesClustersSupplier;
  customResources: CustomResource[];
  fetcher: KubernetesFetcher;
  objectsProvider: KubernetesObjectsProvider;
  serviceLocator: KubernetesServiceLocator;
}>;

// TODO this class is too long, we should divide it up a bit
export class KubernetesBuilder {
  private clusterSupplier?: KubernetesClustersSupplier;
  private defaultClusterRefreshInterval: Duration = Duration.fromObject({
    minutes: 60,
  });
  private objectsProvider?: KubernetesObjectsProvider;
  private fetcher?: KubernetesFetcher;
  private serviceLocator?: KubernetesServiceLocator;

  static createBuilder(env: KubernetesEnvironment) {
    return new KubernetesBuilder(env);
  }

  constructor(protected readonly env: KubernetesEnvironment) {}

  public async build(): KubernetesBuilderReturn {
    const logger = this.env.logger;
    const config = this.env.config;

    logger.info('Initializing Kubernetes backend');

    if (!config.has('kubernetes')) {
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Kubernetes configuration is missing');
      }
      logger.warn(
        'Failed to initialize kubernetes backend: kubernetes config is missing',
      );
      return {
        router: Router(),
      } as unknown as KubernetesBuilderReturn;
    }
    const customResources = this.buildCustomResources();

    const fetcher = this.fetcher ?? this.buildFetcher();

    const clusterSupplier =
      this.clusterSupplier ??
      this.buildClusterSupplier(this.defaultClusterRefreshInterval);

    const serviceLocator =
      this.serviceLocator ??
      this.buildServiceLocator(this.getServiceLocatorMethod(), clusterSupplier);

    const objectsProvider =
      this.objectsProvider ??
      this.buildObjectsProvider({
        logger,
        fetcher,
        serviceLocator,
        customResources,
        objectTypesToFetch: this.getObjectTypesToFetch(),
      });

    const router = this.buildRouter(
      objectsProvider,
      clusterSupplier,
      this.env.catalogApi,
    );

    return {
      clusterSupplier,
      customResources,
      fetcher,
      objectsProvider,
      router,
      serviceLocator,
    };
  }

  public setClusterSupplier(clusterSupplier?: KubernetesClustersSupplier) {
    this.clusterSupplier = clusterSupplier;
    return this;
  }

  public setDefaultClusterRefreshInterval(refreshInterval: Duration) {
    this.defaultClusterRefreshInterval = refreshInterval;
    return this;
  }

  public setObjectsProvider(objectsProvider?: KubernetesObjectsProvider) {
    this.objectsProvider = objectsProvider;
    return this;
  }

  public setFetcher(fetcher?: KubernetesFetcher) {
    this.fetcher = fetcher;
    return this;
  }

  public setServiceLocator(serviceLocator?: KubernetesServiceLocator) {
    this.serviceLocator = serviceLocator;
    return this;
  }

  protected buildCustomResources() {
    const customResources: CustomResource[] = (
      this.env.config.getOptionalConfigArray('kubernetes.customResources') ?? []
    ).map(
      c =>
        ({
          group: c.getString('group'),
          apiVersion: c.getString('apiVersion'),
          plural: c.getString('plural'),
          objectType: 'customresources',
        } as CustomResource),
    );

    this.env.logger.info(
      `action=LoadingCustomResources numOfCustomResources=${customResources.length}`,
    );
    return customResources;
  }

  protected buildClusterSupplier(
    refreshInterval: Duration,
  ): KubernetesClustersSupplier {
    const config = this.env.config;
    return getCombinedClusterSupplier(config, refreshInterval);
  }

  protected buildObjectsProvider(
    options: KubernetesObjectsProviderOptions,
  ): KubernetesObjectsProvider {
    return new KubernetesFanOutHandler(options);
  }

  protected buildFetcher(): KubernetesFetcher {
    return new KubernetesClientBasedFetcher({
      kubernetesClientProvider: new KubernetesClientProvider(),
      logger: this.env.logger,
    });
  }

  protected buildServiceLocator(
    method: ServiceLocatorMethod,
    clusterSupplier: KubernetesClustersSupplier,
  ): KubernetesServiceLocator {
    switch (method) {
      case 'multiTenant':
        return this.buildMultiTenantServiceLocator(clusterSupplier);
      case 'http':
        return this.buildHttpServiceLocator(clusterSupplier);
      default:
        throw new Error(
          `Unsupported kubernetes.clusterLocatorMethod "${method}"`,
        );
    }
  }

  protected buildMultiTenantServiceLocator(
    clusterSupplier: KubernetesClustersSupplier,
  ): KubernetesServiceLocator {
    return new MultiTenantServiceLocator(clusterSupplier);
  }

  protected buildHttpServiceLocator(
    _clusterSupplier: KubernetesClustersSupplier,
  ): KubernetesServiceLocator {
    throw new Error('not implemented');
  }

  protected buildRouter(
    objectsProvider: KubernetesObjectsProvider,
    clusterSupplier: KubernetesClustersSupplier,
    catalogClient: CatalogApi,
  ): express.Router {
    const logger = this.env.logger;
    const router = Router();
    router.use(express.json());

    // TODO fix any
    const getEntityByReq = async (req: Request<any>) => {
      const rawEntityRef = req.query.entity;
      if (rawEntityRef && typeof rawEntityRef !== 'string') {
        throw new InputError(`entity query must be a string`);
      } else if (!rawEntityRef) {
        throw new InputError('entity is a required field');
      }
      let entityRef: CompoundEntityRef | undefined = undefined;

      try {
        entityRef = parseEntityRef(rawEntityRef);
      } catch (error) {
        throw new InputError(`Invalid entity ref, ${error}`);
      }

      function getBearerToken(header?: string): string | undefined {
        return header?.match(/Bearer\s+(\S+)/i)?.[1];
      }
      const entity = await catalogClient.getEntityByRef(entityRef, {
        token: getBearerToken(req.headers.authorization),
      });

      if (!entity) {
        throw new InputError(`Entity ref missing, ${entityRef}`);
      }
      return entity;
    };

    // Deprecated, will be removed soon
    // see https://github.com/backstage/backstage/issues/11309
    router.post('/services/:serviceId', async (req, res) => {
      const serviceId = req.params.serviceId;
      const requestBody: ObjectsByEntityRequest = req.body;
      try {
        const response = await objectsProvider.getKubernetesObjectsByEntity(
          requestBody.entity,
          requestBody.auth!,
        );
        res.json(response);
      } catch (e) {
        logger.error(
          `action=retrieveObjectsByServiceId service=${serviceId}, error=${e}`,
        );
        res.status(500).json({ error: e.message });
      }
    });

    router.post('/resources/workloads', async (req, res) => {
      const entity = await getEntityByReq(req);

      try {
        const response = await objectsProvider.getKubernetesObjectsByEntity(
          entity,
          req.body.auth,
        );
        res.json(response);
      } catch (e) {
        logger.error(
          `action=/resources/workloads entityRef=${stringifyEntityRef(
            entity,
          )}, error=${e}`,
        );
        res.status(500).json({ error: e.message });
      }
    });

    router.post('/resources/custom', async (req, res) => {
      const entity = await getEntityByReq(req);

      try {
        const response = await objectsProvider.getCustomResourcesByEntity(
          entity,
          req.body.customResources,
          req.body.auth,
        );
        res.json(response);
      } catch (e) {
        logger.error(
          `action=/resources/workloads entityRef=${stringifyEntityRef(
            entity,
          )}, error=${e}`,
        );
        res.status(500).json({ error: e.message });
      }
    });

    router.get('/clusters', async (_, res) => {
      const clusterDetails = await this.fetchClusterDetails(clusterSupplier);
      res.json({
        items: clusterDetails.map(cd => ({
          name: cd.name,
          dashboardUrl: cd.dashboardUrl,
          authProvider: cd.authProvider,
          oidcTokenProvider: cd.oidcTokenProvider,
        })),
      });
    });
    return router;
  }

  protected async fetchClusterDetails(
    clusterSupplier: KubernetesClustersSupplier,
  ) {
    const clusterDetails = await clusterSupplier.getClusters();

    this.env.logger.info(
      `action=loadClusterDetails numOfClustersLoaded=${clusterDetails.length}`,
    );

    return clusterDetails;
  }

  protected getServiceLocatorMethod() {
    return this.env.config.getString(
      'kubernetes.serviceLocatorMethod.type',
    ) as ServiceLocatorMethod;
  }

  protected getObjectTypesToFetch() {
    const objectTypesToFetchStrings = this.env.config.getOptionalStringArray(
      'kubernetes.objectTypes',
    ) as KubernetesObjectTypes[];

    const apiVersionOverrides = this.env.config.getOptionalConfig(
      'kubernetes.apiVersionOverrides',
    );

    let objectTypesToFetch;

    if (objectTypesToFetchStrings) {
      objectTypesToFetch = DEFAULT_OBJECTS.filter(obj =>
        objectTypesToFetchStrings.includes(obj.objectType),
      );
    }

    if (apiVersionOverrides) {
      objectTypesToFetch = objectTypesToFetch ?? DEFAULT_OBJECTS;

      for (const obj of objectTypesToFetch) {
        if (apiVersionOverrides.has(obj.objectType)) {
          obj.apiVersion = apiVersionOverrides.getString(obj.objectType);
        }
      }
    }

    return objectTypesToFetch;
  }
}
