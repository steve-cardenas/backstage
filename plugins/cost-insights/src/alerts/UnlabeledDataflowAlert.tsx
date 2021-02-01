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

import React from 'react';
import { UnlabeledDataflowAlertCard } from '../components/UnlabeledDataflowAlertCard';
import { Alert, AlertStatus, UnlabeledDataflowData } from '../types';

/**
 * The alert below is an example of an Alert implementation; the CostInsightsApi permits returning
 * any implementation of the Alert type, so adopters can create their own. The CostInsightsApi
 * fetches alert data from the backend, then creates Alert classes with the data.
 */

export class UnlabeledDataflowAlert implements Alert {
  data: UnlabeledDataflowData;
  status?: AlertStatus;

  url = '/cost-insights/labeling-jobs';
  title = 'Add labels to workflows';
  subtitle =
    'Labels show in billing data, enabling cost insights for each workflow.';

  constructor(data: UnlabeledDataflowData) {
    this.data = data;
  }

  static create<T>(
    data: UnlabeledDataflowData,
    options: Partial<Alert> = {},
    props?: T,
  ): Alert {
    const {
      url = '/cost-insights/labeling-jobs',
      title = 'Add labels to workflows',
      subtitle = 'Labels show in billing data, enabling cost insights for each workflow.',
      element = <UnlabeledDataflowAlertCard alert={data} />,
      ...opts
    } = options;
    return {
      title: title,
      subtitle: subtitle,
      url: url,
      element: element,
      ...opts,
      ...props,
    };
  }

  get element() {
    return <UnlabeledDataflowAlertCard alert={this.data} />;
  }
}
