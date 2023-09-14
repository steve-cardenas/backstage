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
import { Config } from '@backstage/config';
import fetch from 'node-fetch';
import { Project, Filter, Issue } from './types';
import { resolveJiraBaseUrl, resolveJiraToken } from './config';

export const getProjectInfo = async (
  projectKey: string,
  config: Config,
): Promise<Project> => {
  const response = await fetch(
    `${resolveJiraBaseUrl(config)}project/${projectKey}`,
    {
      method: 'GET',
      headers: {
        Authorization: resolveJiraToken(config),
        Accept: 'application/json',
      },
    },
  );
  if (response.status !== 200) {
    throw Error(`${response.status}`);
  }
  return response.json();
};

export const getFilterById = async (
  id: string,
  config: Config,
): Promise<Filter> => {
  const response = await fetch(`${resolveJiraBaseUrl(config)}filter/${id}`, {
    method: 'GET',
    headers: {
      Authorization: resolveJiraToken(config),
      Accept: 'application/json',
    },
  });
  if (response.status !== 200) {
    throw Error(`${response.status}`);
  }
  const jsonResponse = await response.json();
  return { name: jsonResponse.name, query: jsonResponse.jql } as Filter;
};

export const getIssuesByFilter = async (
  projectKey: string,
  query: string,
  config: Config,
): Promise<Issue[]> => {
  const response = await fetch(
    `${resolveJiraBaseUrl(
      config,
    )}search?jql=project=${projectKey} AND ${query}`,
    {
      method: 'GET',
      headers: {
        Authorization: resolveJiraToken(config),
        Accept: 'application/json',
      },
    },
  ).then(resp => resp.json());
  return response.issues;
};

export const getIssuesByComponent = async (
  projectKey: string,
  componentKey: string,
  config: Config,
): Promise<Issue[]> => {
  const response = await fetch(
    `${resolveJiraBaseUrl(
      config,
    )}search?jql=project=${projectKey} AND component = "${componentKey}"`,
    {
      method: 'GET',
      headers: {
        Authorization: resolveJiraToken(config),
        Accept: 'application/json',
      },
    },
  ).then(resp => resp.json());
  return response.issues;
};

export async function getProjectAvatar(url: string, config: Config) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: resolveJiraToken(config),
    },
  });
  return response;
}
