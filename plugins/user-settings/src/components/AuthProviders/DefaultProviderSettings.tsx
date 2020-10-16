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
import {
  githubAuthApiRef,
  gitlabAuthApiRef,
  googleAuthApiRef,
  oauth2ApiRef,
  oktaAuthApiRef,
  microsoftAuthApiRef,
  useApi,
  configApiRef,
} from '@backstage/core';
import Star from '@material-ui/icons/Star';
import React from 'react';
import { ProviderSettingsItem } from './ProviderSettingsItem';

type Props = {
  configuredProviders: string[];
};

export const DefaultProviderSettings = ({ configuredProviders }: Props) => {
  const configApi = useApi(configApiRef);
  const organizationName = configApi.getString('organization.name');
  return (
    <>
      {configuredProviders.includes('google') && (
        <ProviderSettingsItem
          title="Google"
          description={googleAuthApiRef.description}
          apiRef={googleAuthApiRef}
          icon={Star}
        />
      )}
      {configuredProviders.includes('microsoft') && (
        <ProviderSettingsItem
          title="Microsoft"
          description={microsoftAuthApiRef.description}
          apiRef={microsoftAuthApiRef}
          icon={Star}
        />
      )}
      {configuredProviders.includes('github') && (
        <ProviderSettingsItem
          title="Github"
          description={githubAuthApiRef.description}
          apiRef={githubAuthApiRef}
          icon={Star}
        />
      )}
      {configuredProviders.includes('gitlab') && (
        <ProviderSettingsItem
          title="Gitlab"
          description={gitlabAuthApiRef.description}
          apiRef={gitlabAuthApiRef}
          icon={Star}
        />
      )}
      {configuredProviders.includes('okta') && (
        <ProviderSettingsItem
          title="Okta"
          description={oktaAuthApiRef.description}
          apiRef={oktaAuthApiRef}
          icon={Star}
        />
      )}
      {configuredProviders.includes('oauth2') && (
        <ProviderSettingsItem
          title={organizationName || ''}
          description={oauth2ApiRef.description}
          apiRef={oauth2ApiRef}
          icon={Star}
        />
      )}
    </>
  );
};
