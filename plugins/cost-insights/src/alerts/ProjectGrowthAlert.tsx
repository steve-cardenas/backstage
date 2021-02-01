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
import { ProjectGrowthAlertCard } from '../components/ProjectGrowthAlertCard';
import { Alert, ProjectGrowthData } from '../types';

/**
 * The alert below is an example of an Alert implementation; the CostInsightsApi permits returning
 * any implementation of the Alert type, so adopters can create their own. The CostInsightsApi
 * fetches alert data from the backend, then creates Alert classes with the data.
 */

export class ProjectGrowthAlert implements Alert {
  data: ProjectGrowthData;

  url = '/cost-insights/investigating-growth';
  subtitle =
    'Cost growth outpacing business growth is unsustainable long-term.';

  constructor(data: ProjectGrowthData) {
    this.data = data;
  }

  /**
   * Create a custom instance of a ProjectGrowth Alert.
   * @param data
   * @param options
   * @param props
   */
  static create<T>(
    data: ProjectGrowthData,
    options: Partial<Alert> = {},
    props?: T,
  ): Alert {
    const {
      title = `Investigate cost growth in project ${data.project}`,
      subtitle = 'Cost growth outpacing business growth is unsustainable long-term.',
      url = '/cost-insights/investigating-growth',
      element = <ProjectGrowthAlertCard alert={data} />,
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

  get title() {
    return `Investigate cost growth in project ${this.data.project}`;
  }

  get element() {
    return <ProjectGrowthAlertCard alert={this.data} />;
  }
}
