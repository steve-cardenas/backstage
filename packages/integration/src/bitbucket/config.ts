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

import { Config } from '@backstage/config';
import { trimEnd } from 'lodash';
import { isValidHost, isValidUrl } from '../helpers';

const BITBUCKET_HOST = 'bitbucket.org';
const BITBUCKET_BASE_URL = `https://${BITBUCKET_HOST}`;
const BITBUCKET_API_BASE_URL = 'https://api.bitbucket.org/2.0';

/**
 * The configuration parameters for a single Bitbucket API provider.
 *
 * @public
 */
export type BitbucketIntegrationConfig = {
  /**
   * The host of the target that this matches on, e.g. "bitbucket.org"
   */
  host: string;

  /**
   * The baseUrl of this provider, e.g. "https://bitbucket.org", which is passed
   * into the Bitbucket client.
   *
   * If no baseUrl is provided, it will default to https://${host}
   */
  baseUrl?: string;

  /**
   * The base URL of the API of this provider, e.g. "https://api.bitbucket.org/2.0",
   * with no trailing slash.
   *
   * May be omitted specifically for Bitbucket Cloud; then it will be deduced.
   *
   * The API will always be preferred if both its base URL and a token are
   * present.
   */
  apiBaseUrl?: string;

  /**
   * The authorization token to use for requests to a Bitbucket Server provider.
   *
   * See https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html
   *
   * If no token is specified, anonymous access is used.
   */
  token?: string;

  /**
   * The username to use for requests to Bitbucket Cloud (bitbucket.org).
   */
  username?: string;

  /**
   * Authentication with Bitbucket Cloud (bitbucket.org) is done using app passwords.
   *
   * See https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/
   */
  appPassword?: string;
};

/**
 * Reads a single Bitbucket integration config.
 *
 * @param config - The config object of a single integration
 * @public
 */
export function readBitbucketIntegrationConfig(
  config: Config,
): BitbucketIntegrationConfig {
  const host = config.getOptionalString('host') ?? BITBUCKET_HOST;
  let baseUrl = config.getOptionalString('baseUrl');
  let apiBaseUrl = config.getOptionalString('apiBaseUrl');
  const token = config.getOptionalString('token');
  const username = config.getOptionalString('username');
  const appPassword = config.getOptionalString('appPassword');

  if (!isValidHost(host)) {
    throw new Error(
      `Invalid Bitbucket integration config, '${host}' is not a valid host`,
    );
  }

  if (baseUrl) {
    baseUrl = trimEnd(baseUrl, '/');
  } else {
    baseUrl = `https://${host}`;
  }

  if (!isValidUrl(baseUrl)) {
    throw new Error(
      `Invalid Bitbucket integration config, '${baseUrl}' is not a valid baseUrl`,
    );
  }

  if (apiBaseUrl) {
    apiBaseUrl = trimEnd(apiBaseUrl, '/');
  } else if (host === BITBUCKET_HOST) {
    apiBaseUrl = BITBUCKET_API_BASE_URL;
  } else {
    apiBaseUrl = `${baseUrl}/rest/api/1.0`;
  }

  if (!isValidUrl(apiBaseUrl)) {
    throw new Error(
      `Invalid Bitbucket integration config, '${apiBaseUrl}' is not a valid apiBaseUrl`,
    );
  }

  return {
    host,
    baseUrl,
    apiBaseUrl,
    token,
    username,
    appPassword,
  };
}

/**
 * Reads a set of Bitbucket integration configs, and inserts some defaults for
 * public Bitbucket if not specified.
 *
 * @param configs - All of the integration config objects
 * @public
 */
export function readBitbucketIntegrationConfigs(
  configs: Config[],
): BitbucketIntegrationConfig[] {
  // First read all the explicit integrations
  const result = configs.map(readBitbucketIntegrationConfig);

  // If no explicit bitbucket.org integration was added, put one in the list as
  // a convenience
  if (!result.some(c => c.host === BITBUCKET_HOST)) {
    result.push({
      host: BITBUCKET_HOST,
      baseUrl: BITBUCKET_BASE_URL,
      apiBaseUrl: BITBUCKET_API_BASE_URL,
    });
  }

  return result;
}
