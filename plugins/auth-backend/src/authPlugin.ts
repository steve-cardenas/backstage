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
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import {
  AuthProviderFactory,
  authProvidersExtensionPoint,
} from '@backstage/plugin-auth-node';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { createRouter } from './service/router';

/**
 * Auth plugin
 *
 * @public
 */
export const authPlugin = createBackendPlugin({
  pluginId: 'auth',
  register(reg) {
    const providers = new Map<string, AuthProviderFactory>();

    reg.registerExtensionPoint(authProvidersExtensionPoint, {
      registerProvider({ providerId, factory }) {
        if (providers.has(providerId)) {
          throw new Error(
            `Auth provider '${providerId}' was already registered`,
          );
        }
        providers.set(providerId, factory);
      },
    });

    reg.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        database: coreServices.database,
        discovery: coreServices.discovery,
        tokenManager: coreServices.tokenManager,
        catalogApi: catalogServiceRef,
      },
      async init({
        httpRouter,
        logger,
        config,
        database,
        discovery,
        tokenManager,
        catalogApi,
      }) {
        const router = await createRouter({
          logger,
          config,
          database,
          discovery,
          tokenManager,
          catalogApi,
          providerFactories: Object.fromEntries(providers),
          disableDefaultProviderFactories: true,
        });
        httpRouter.use(router);
      },
    });
  },
});
