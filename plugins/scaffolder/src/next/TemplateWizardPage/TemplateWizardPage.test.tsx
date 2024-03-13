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
import { ApiProvider } from '@backstage/core-app-api';
import { analyticsApiRef } from '@backstage/core-plugin-api';
import {
  MockAnalyticsApi,
  renderInTestApp,
  TestApiRegistry,
} from '@backstage/test-utils';
import { act, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  ScaffolderApi,
  scaffolderApiRef,
  SecretsContextProvider,
} from '@backstage/plugin-scaffolder-react';
import { TemplateWizardPage } from './TemplateWizardPage';
import { rootRouteRef } from '../../routes';
import { CatalogApi, catalogApiRef } from '@backstage/plugin-catalog-react';
import { ANNOTATION_EDIT_URL } from '@backstage/catalog-model';

jest.mock('react-router-dom', () => {
  return {
    ...(jest.requireActual('react-router-dom') as any),
    useParams: () => ({
      templateName: 'test',
    }),
  };
});

const scaffolderApiMock: jest.Mocked<ScaffolderApi> = {
  cancelTask: jest.fn(),
  scaffold: jest.fn(),
  getTemplateParameterSchema: jest.fn(),
  getIntegrationsList: jest.fn(),
  getTask: jest.fn(),
  streamLogs: jest.fn(),
  listActions: jest.fn(),
  listTasks: jest.fn(),
};

const catalogApiMock: jest.Mocked<CatalogApi> = {
  getEntityByRef: jest.fn(),
} as any;

const analyticsMock = new MockAnalyticsApi();
const apis = TestApiRegistry.from(
  [scaffolderApiRef, scaffolderApiMock],
  [analyticsApiRef, analyticsMock],
  [catalogApiRef, catalogApiMock],
);

const entityRefResponse = {
  apiVersion: 'v1',
  kind: 'service',
  metadata: {
    name: 'test',
    annotations: {
      [ANNOTATION_EDIT_URL]: 'http://localhost:3000',
    },
  },
  spec: {
    profile: {
      displayName: 'BackUser',
    },
  },
};
describe('TemplateWizardPage', () => {
  it('captures expected analytics events', async () => {
    scaffolderApiMock.scaffold.mockResolvedValue({ taskId: 'xyz' });
    scaffolderApiMock.getTemplateParameterSchema.mockResolvedValue({
      steps: [
        {
          title: 'Step 1',
          schema: {
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
      ],
      title: 'React JSON Schema Form Test',
    });
    catalogApiMock.getEntityByRef.mockResolvedValue(entityRefResponse);

    const { findByRole, getByRole } = await renderInTestApp(
      <ApiProvider apis={apis}>
        <SecretsContextProvider>
          <TemplateWizardPage customFieldExtensions={[]} />,
        </SecretsContextProvider>
      </ApiProvider>,
      {
        mountedRoutes: {
          '/create': rootRouteRef,
        },
      },
    );

    // Fill out the name field
    fireEvent.change(getByRole('textbox', { name: 'name' }), {
      target: { value: 'expected-name' },
    });

    // Go to the final page
    await act(async () => {
      fireEvent.click(await findByRole('button', { name: 'Review' }));
    });

    // Create the software
    await act(async () => {
      fireEvent.click(await findByRole('button', { name: 'Create' }));
    });

    // The "Next Step" button should have fired few events
    expect(analyticsMock.getEvents()[0]).toMatchObject({
      action: 'click',
      subject: 'Next Step (1)',
      context: { entityRef: 'template:default/test' },
    });

    expect(analyticsMock.getEvents()[1]).toMatchObject({
      action: 'click',
      subject: '[template:default/test]: Next Step (1)',
      context: { entityRef: 'template:default/test' },
    });

    // And the "Create" button should have fired few event
    expect(analyticsMock.getEvents()[2]).toMatchObject({
      action: 'create',
      subject: 'expected-name',
      context: { entityRef: 'template:default/test' },
    });

    expect(analyticsMock.getEvents()[3]).toMatchObject({
      action: 'click',
      subject: '[template:default/test]: Create',
      context: { entityRef: 'template:default/test' },
    });
  });
  describe('scaffolder page context menu', () => {
    it('should render if editUrl is set to url', async () => {
      catalogApiMock.getEntityByRef.mockResolvedValue({
        apiVersion: 'v1',
        kind: 'service',
        metadata: {
          name: 'test',
          annotations: {
            [ANNOTATION_EDIT_URL]: 'http://localhost:3000',
          },
        },
        spec: {
          profile: {
            displayName: 'BackUser',
          },
        },
      });
      const { queryByTestId } = await renderInTestApp(
        <ApiProvider apis={apis}>
          <SecretsContextProvider>
            <TemplateWizardPage customFieldExtensions={[]} />,
          </SecretsContextProvider>
        </ApiProvider>,
        {
          mountedRoutes: {
            '/create': rootRouteRef,
          },
        },
      );
      expect(queryByTestId('menu-button')).toBeInTheDocument();
    });
    it('should not render if editUrl is undefined', async () => {
      catalogApiMock.getEntityByRef.mockResolvedValue({
        apiVersion: 'v1',
        kind: 'service',
        metadata: {
          name: 'test',
          // annotations are not set
        },
        spec: {
          profile: {
            displayName: 'BackUser',
          },
        },
      });
      const { queryByTestId } = await renderInTestApp(
        <ApiProvider apis={apis}>
          <SecretsContextProvider>
            <TemplateWizardPage customFieldExtensions={[]} />,
          </SecretsContextProvider>
        </ApiProvider>,
        {
          mountedRoutes: {
            '/create': rootRouteRef,
          },
        },
      );
      expect(queryByTestId('menu-button')).not.toBeInTheDocument();
    });
  });
});
