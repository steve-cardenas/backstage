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

import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
import {
  ConfigInfo,
  DevToolsInfo,
  ExternalDependency,
  TaskInfo,
} from '@backstage/plugin-devtools-common';
import { ResponseError } from '@backstage/errors';
import { DevToolsApi } from './DevToolsApi';

export class DevToolsClient implements DevToolsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;

  public constructor(options: {
    discoveryApi: DiscoveryApi;
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
  }

  public async getConfig(): Promise<ConfigInfo | undefined> {
    const urlSegment = 'config';

    const configInfo = await this.request<ConfigInfo | undefined>(urlSegment);
    return configInfo;
  }

  public async getExternalDependencies(): Promise<
    ExternalDependency[] | undefined
  > {
    const urlSegment = 'external-dependencies';

    const externalDependencies = await this.request<
      ExternalDependency[] | undefined
    >(urlSegment);
    return externalDependencies;
  }

  public async getInfo(): Promise<DevToolsInfo | undefined> {
    const urlSegment = 'info';

    const info = await this.request<DevToolsInfo | undefined>(urlSegment);
    return info;
  }

  public async getTasks(): Promise<TaskInfo[] | undefined> {
    const urlSegment = 'tasks';
    const tasks = await this.request<TaskInfo[] | undefined>(urlSegment);
    return tasks;
  }

  public async triggerTask(scheduler: string, task: string): Promise<void> {
    const urlSegment = `tasks/${scheduler}/${task}`;
    await this.request(urlSegment, 'POST');
  }

  private async request<T>(path: string, method?: string): Promise<T> {
    const baseUrl = `${await this.discoveryApi.getBaseUrl('devtools')}/`;
    const url = new URL(path, baseUrl);

    const { token } = await this.identityApi.getCredentials();
    const response = await fetch(url.toString(), {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json() as Promise<T>;
  }
}
