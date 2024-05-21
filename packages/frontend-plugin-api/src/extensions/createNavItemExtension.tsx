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

import { IconComponent } from '@backstage/core-plugin-api';
import { createSchemaFromZod } from '../schema/createSchemaFromZod';
import {
  createExtension,
  createExtensionDataRef,
  createExtensionInput,
} from '../wiring';
import { ExternalRouteRef, RouteRef } from '../routing';

/**
 * Helper for creating extensions for a nav item.
 * @public
 */
export function createNavItemExtension(options: {
  type?: 'drawer' | 'dropdown';
  namespace?: string;
  name?: string;
  attachTo?: { id: string; input: string };
  disabled?: boolean;
  routeRef: RouteRef<undefined> | ExternalRouteRef<undefined>;
  title: string;
  icon: IconComponent;
  modal?: (props: { open: boolean; handleClose: () => void }) => JSX.Element;
}) {
  const {
    type,
    icon,
    title,
    name,
    namespace,
    modal,
    routeRef,
    attachTo,
    disabled,
  } = options;
  return createExtension({
    namespace,
    name,
    disabled,
    kind: 'nav-item',
    attachTo: attachTo ?? { id: 'app/nav', input: 'items' },
    configSchema: createSchemaFromZod(z =>
      z.object({
        title: z.string().default(title),
      }),
    ),
    inputs: {
      items: createExtensionInput({
        target: createNavItemExtension.targetDataRef.optional(),
      }),
    },
    output: {
      navTarget: createNavItemExtension.targetDataRef,
    },
    factory: ({ config }) => {
      return {
        navTarget: {
          title: config.title,
          type,
          icon,
          routeRef,
          modal,
        },
      };
    },
  });
}

/** @public */
export namespace createNavItemExtension {
  // TODO(Rugvip): Should this be broken apart into separate refs? title/icon/routeRef
  export const targetDataRef = createExtensionDataRef<{
    type?: 'drawer' | 'dropdown';
    title: string;
    icon: IconComponent;
    routeRef: RouteRef<undefined> | ExternalRouteRef<undefined>;
    modal?: (props: { open: boolean; handleClose: () => void }) => JSX.Element;
  }>('core.nav-item.target');
}
