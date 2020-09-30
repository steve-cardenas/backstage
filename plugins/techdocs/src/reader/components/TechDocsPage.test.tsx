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
import { TechDocsPage } from './TechDocsPage';
import { render, act } from '@testing-library/react';
import { wrapInTestApp } from '@backstage/test-utils';
import { ApiRegistry, ApiProvider } from '@backstage/core-api';
import {
  techdocsApiRef,
  TechDocsApi,
  techdocsStorageApiRef,
  TechDocsStorageApi,
} from '../../api';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useParams: jest.fn(),
  };
});

jest.mock('./TechDocsHeader', () => {
  return {
    __esModule: true,
    TechDocsHeader: () => <div />,
  };
});

const { useParams }: { useParams: jest.Mock } = jest.requireMock(
  'react-router-dom',
);

describe('<TechDocsPage />', () => {
  it('should render a header and content components', async () => {
    useParams.mockReturnValue({
      entityId: 'Component::backstage',
    });

    const techDocsApi: Partial<TechDocsApi> = {
      getMetadata: () => Promise.resolve([]),
    };
    const techDocsStorageApi: Partial<TechDocsStorageApi> = {
      getEntityDocs: (): Promise<string> => Promise.resolve('String'),
      getBaseUrl: (): string => '',
    };

    const apiRegistry = ApiRegistry.from([
      [techdocsApiRef, techDocsApi],
      [techdocsStorageApiRef, techDocsStorageApi],
    ]);

    await act(async () => {
      const rendered = render(
        wrapInTestApp(
          <ApiProvider apis={apiRegistry}>
            <TechDocsPage />
          </ApiProvider>,
        ),
      );
      expect(rendered.getByTestId('techdocs-content')).toBeInTheDocument();
    });
  });
});
