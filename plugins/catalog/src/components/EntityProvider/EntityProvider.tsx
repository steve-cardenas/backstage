/*
 * Copyright 2020 Spotify AB
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
import { Entity } from '@backstage/catalog-model';
import React, { ReactNode } from 'react';
import { EntityContext } from '@backstage/plugin-catalog-common-react';

type EntityProviderProps = {
  entity: Entity;
  children: ReactNode;
};

export const EntityProvider = ({ entity, children }: EntityProviderProps) => (
  <EntityContext.Provider
    value={{
      entity,
      loading: Boolean(entity),
      error: undefined,
    }}
  >
    {children}
  </EntityContext.Provider>
);
