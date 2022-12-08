/*
 * Copyright 2022 The Backstage Authors
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
import { InputError, AuthenticationError } from '@backstage/errors';
import express, { Request } from 'express';
import { getBearerTokenFromAuthorizationHeader } from '@backstage/plugin-auth-node';
import {
  AuthorizeResult,
  PermissionEvaluator,
  PermissionCriteria,
} from '@backstage/plugin-permission-common';
import {
  kubernetesWorkloadResourcesReadPermission,
  kubernetesCustomResourcesReadPermission,
} from '@backstage/plugin-kubernetes-common';
import { NotAllowedError } from '@backstage/errors';
import {
  isAndCriteria,
  isNotCriteria,
  isOrCriteria,
} from '@backstage/plugin-permission-node';
import {
  transformConditions,
  DEFAULT_OBJECTS,
  KubernetesObjectsProvider,
  ObjectToFetch,
} from '@backstage/plugin-kubernetes-backend';
import lodash from 'lodash';

export const addResourceRoutesToRouter = (
  router: express.Router,
  catalogApi: CatalogApi,
  objectsProvider: KubernetesObjectsProvider,
  permissionApi: PermissionEvaluator,
) => {
  const getEntityByReq = async (req: Request<any>) => {
    const rawEntityRef = req.body.entityRef;
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

    const token = getBearerTokenFromAuthorizationHeader(
      req.headers.authorization,
    );

    if (!token) {
      throw new AuthenticationError('No Backstage token');
    }

    const entity = await catalogApi.getEntityByRef(entityRef, {
      token: token,
    });

    if (!entity) {
      throw new InputError(
        `Entity ref missing, ${stringifyEntityRef(entityRef)}`,
      );
    }
    return entity;
  };

  const conditionsParser = (
    conditions: PermissionCriteria<ObjectToFetch>,
  ): Set<ObjectToFetch> => {
    if (isAndCriteria(conditions)) {
      const setObjFetch: Set<ObjectToFetch>[] =
        conditions.allOf.map(conditionsParser);
      const arrObjFetch: ObjectToFetch[][] = setObjFetch.map(crit =>
        Array.from(crit),
      );
      return new Set(lodash.intersection(...arrObjFetch));
    } else if (isOrCriteria(conditions)) {
      const setObjFetch: Set<ObjectToFetch>[] =
        conditions.anyOf.map(conditionsParser);
      const arrObjFetch: ObjectToFetch[][] = setObjFetch.map(crit =>
        Array.from(crit),
      );
      return new Set(lodash.union(...arrObjFetch));
    } else if (isNotCriteria(conditions)) {
      const returnedValue = conditionsParser(conditions);
      return new Set(
        lodash.difference(DEFAULT_OBJECTS, Array.from(returnedValue)),
      );
    }
    return new Set([conditions]);
  };

  router.post('/resources/workloads/query', async (req, res) => {
    const token = getBearerTokenFromAuthorizationHeader(
      req.header('authorization'),
    );
    const authorizeResponse = (
      await permissionApi.authorizeConditional(
        [
          {
            permission: kubernetesWorkloadResourcesReadPermission,
          },
        ],
        { token },
      )
    )[0];
    if (authorizeResponse.result === AuthorizeResult.DENY) {
      res.status(403).json({ error: new NotAllowedError('Unauthorized') });
      return;
    }
    const entity = await getEntityByReq(req);
    const response = await objectsProvider.getKubernetesObjectsByEntity({
      entity,
      auth: req.body.auth,
    });
    let editedResponse = response;
    if (authorizeResponse.result === AuthorizeResult.CONDITIONAL) {
      const conditions: PermissionCriteria<ObjectToFetch> = transformConditions(
        authorizeResponse.conditions,
      );
      const filteringArray = Array.from(conditionsParser(conditions));
      const filteredResponse = {
        items: response.items.map(clusterObjects => ({
          ...clusterObjects,
          resources: clusterObjects.resources.filter(fetchResponse => {
            return filteringArray.some(
              ({ objectType }) => fetchResponse.type === objectType,
            );
          }),
        })),
      };
      editedResponse = filteredResponse;
    }
    res.json(editedResponse);
  });

  router.post('/resources/custom/query', async (req, res) => {
    const token = getBearerTokenFromAuthorizationHeader(
      req.header('authorization'),
    );

    const authorizeResponse = (
      await permissionApi.authorizeConditional(
        [
          {
            permission: kubernetesCustomResourcesReadPermission,
          },
        ],
        { token },
      )
    )[0];

    if (authorizeResponse.result === AuthorizeResult.DENY) {
      res.status(403).json({ error: new NotAllowedError('Unauthorized') });
      return;
    }

    const entity = await getEntityByReq(req);
    if (!req.body.customResources) {
      throw new InputError('customResources is a required field');
    } else if (!Array.isArray(req.body.customResources)) {
      throw new InputError('customResources must be an array');
    } else if (req.body.customResources.length === 0) {
      throw new InputError('at least 1 customResource is required');
    }
    const response = await objectsProvider.getCustomResourcesByEntity({
      entity,
      customResources: req.body.customResources,
      auth: req.body.auth,
    });
    res.json(response);
  });
};
