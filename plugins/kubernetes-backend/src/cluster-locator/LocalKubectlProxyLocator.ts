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

import { ClusterDetails, KubernetesClustersSupplier } from '../types/types';

export class LocalKubectlProxyClusterLocator
  implements KubernetesClustersSupplier
{
  private readonly clusterDetails: ClusterDetails[];

  public constructor() {
    this.clusterDetails = [
      {
        name: 'local',
        alias: 'proxy',
        url: 'http:/localhost:8001',
        authProvider: 'localKubectlProxy',
        skipMetricsLookup: true,
      },
    ];
  }

  async getClusters(): Promise<ClusterDetails[]> {
    return this.clusterDetails;
  }
}
