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
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  fetchApiRef,
  // identityApiRef,
} from '@backstage/core-plugin-api';

import { NotificationsApiImpl, notificationsApiRef } from './api';
import { notificationsRootRouteRef } from './routes';

export const notificationsPlugin = createPlugin({
  id: 'notifications',
  routes: {
    root: notificationsRootRouteRef,
  },
  apis: [
    createApiFactory({
      api: notificationsApiRef,
      deps: { fetchApi: fetchApiRef },
      factory({ fetchApi }) {
        return new NotificationsApiImpl({
          fetchApi,
        });
      },
    }),
  ],
});

export const NotificationsPage = notificationsPlugin.provide(
  createRoutableExtension({
    name: 'NotificationsPage',
    component: () =>
      import('./components/NotificationsPage').then(m => m.NotificationsPage),
    mountPoint: notificationsRootRouteRef,
  }),
);
