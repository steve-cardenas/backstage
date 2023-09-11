/*
 * Copyright 2023 The Backstage Authors
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
  CacheManager,
  TokenManager,
  errorHandler,
} from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Config } from '@backstage/config';
import { Logger } from 'winston';
import { CatalogClient } from '@backstage/catalog-client';
import { DiscoveryApi } from '@backstage/plugin-permission-common';
import { IdentityApi } from '@backstage/plugin-auth-node';
import {
  getFiltersFromAnnotations,
  getIssuesFromComponents,
  getIssuesFromFilters,
  getProjectResponse,
} from './service';
import { getDefaultFilters } from '../filters';
import { Filter, Project, JiraResponse } from '../types';
import { getProjectAvatar } from '../api';
import stream from 'stream';
import {
  COMPONENT_ANNOTATION,
  FILTER_ANNOTATION,
  PROJECT_KEY_ANNOTATION,
} from '../annotations';

export interface RouterOptions {
  logger: Logger;
  config: Config;
  discovery: DiscoveryApi;
  identity: IdentityApi;
  tokenManager: TokenManager;
}

const DEFAULT_TTL = 1000 * 60;

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, discovery, identity, tokenManager } = options;
  const catalogClient = new CatalogClient({ discoveryApi: discovery });
  logger.info('Initializing Jira Dashboard backend');

  const pluginCache =
    CacheManager.fromConfig(config).forPlugin('jira-dashboard');
  const cache = pluginCache.getClient({ defaultTtl: DEFAULT_TTL });

  const router = Router();
  router.use(express.json());

  router.get('/:entityRef', async (request, response) => {
    const entityRef = request.params.entityRef;
    const { token } = await tokenManager.getToken();
    const entity = await catalogClient.getEntityByRef(entityRef, { token });

    if (!entity) {
      logger.info(`No entity found for ${entityRef}`);
      response.status(500).json({ error: `No entity found for ${entityRef}` });
      return;
    }

    const projectKey = entity.metadata.annotations?.[PROJECT_KEY_ANNOTATION]!;

    if (!projectKey) {
      logger.info(`No Jira annotation found for ${entityRef}`);
      response
        .status(500)
        .json({ error: `No Jira annotation found for ${entityRef}` });
      return;
    }

    let projectResponse;

    try {
      projectResponse = await getProjectResponse(projectKey, config, cache);
    } catch (err) {
      logger.error('Could not find Jira project');
      response.status(404).json({
        error: `No Jira project found for project key ${projectKey}`,
      });
      return;
    }

    const userIdentity = await identity.getIdentity({ request: request });

    if (!userIdentity) {
      logger.warn(`Could not find user identity`);
    }

    let filters: Filter[] = [];

    const customFilterAnnotations =
      entity.metadata.annotations?.[FILTER_ANNOTATION]?.split(':')!;

    if (customFilterAnnotations) {
      filters = await getFiltersFromAnnotations(
        customFilterAnnotations,
        config,
      );
    } else {
      filters = getDefaultFilters(userIdentity?.identity?.userEntityRef);
    }

    let issues = await getIssuesFromFilters(projectKey, filters, config);

    const componentAnnotations =
      entity.metadata.annotations?.[COMPONENT_ANNOTATION]?.split(':')!;

    if (componentAnnotations) {
      const componentIssues = await getIssuesFromComponents(
        projectKey,
        componentAnnotations,
        config,
      );
      issues = issues.concat(componentIssues);
    }

    const jiraResponse: JiraResponse = {
      project: projectResponse as Project,
      data: issues,
    };
    response.json(jiraResponse);
  });

  router.get('/avatar/:entityRef', async (request, response) => {
    const { entityRef } = request.params;
    const { token } = await tokenManager.getToken();
    const entity = await catalogClient.getEntityByRef(entityRef, { token });

    if (!entity) {
      logger.info(`No entity found for ${entityRef}`);
      response.status(500).json({ error: `No entity found for ${entityRef}` });
      return;
    }

    const projectKey = entity.metadata.annotations?.[PROJECT_KEY_ANNOTATION]!;

    const projectResponse = await getProjectResponse(projectKey, config, cache);

    if (!projectResponse) {
      logger.error('Could not find Jira project in Jira');
      response.status(400).json({
        error: `No Jira project found for project key ${projectKey}`,
      });
      return;
    }

    const url = projectResponse.avatarUrls['48x48'];

    const avatar = await getProjectAvatar(url, config);

    const ps = new stream.PassThrough();
    const val = avatar.headers.get('content-type');

    response.setHeader('content-type', val ?? '');
    stream.pipeline(avatar.body, ps, err => {
      if (err) {
        logger.error(err);
        response.sendStatus(400);
      }
      return;
    });
    ps.pipe(response);
  });
  router.use(errorHandler());
  return router;
}
