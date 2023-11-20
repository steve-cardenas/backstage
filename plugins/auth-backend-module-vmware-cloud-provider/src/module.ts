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
import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  authProvidersExtensionPoint,
  commonSignInResolvers,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';

import { vmwareCloudAuthenticator } from './authenticator';
import { vmwareCloudSignInResolvers } from './resolvers';

/**
 * VMware Cloud Provider backend module for the auth plugin
 *
 * @public
 */
export const authModuleVmwareCloudProvider = createBackendModule({
  pluginId: 'auth',
  moduleId: 'vmware-cloud-provider',
  register(reg) {
    reg.registerInit({
      deps: { providers: authProvidersExtensionPoint },
      async init({ providers }) {
        providers.registerProvider({
          providerId: 'vmwareCloudServices',
          factory: createOAuthProviderFactory({
            authenticator: vmwareCloudAuthenticator,
            signInResolverFactories: {
              ...vmwareCloudSignInResolvers,
              ...commonSignInResolvers,
            },
          }),
        });
      },
    });
  },
});
