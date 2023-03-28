/*
 * Copyright 2021 The Backstage Authors
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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MockEntityListContextProvider } from '../../testUtils/providers';
import { EntityFieldFilter } from '../../filters';
import { EntityGenericPicker } from './EntityGenericPicker';
import { catalogApiRef } from '../../api';
import { CatalogApi } from '@backstage/catalog-client';
import { TestApiProvider } from '@backstage/test-utils';

const domains = ['domain1', 'domain2', 'domain3'];

const EntityDomainPicker = () => (
  <EntityGenericPicker name="domain" filterValue={['metadata', 'domain']} />
);

describe('<EntityGenericPicker/>', () => {
  const mockCatalogApiRef = {
    getEntityFacets: async () => ({
      facets: { 'metadata.domain': domains.map(value => ({ value })) },
    }),
  } as unknown as CatalogApi;
  it('renders all options', async () => {
    render(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApiRef]]}>
        <MockEntityListContextProvider value={{}}>
          <EntityDomainPicker />
        </MockEntityListContextProvider>
      </TestApiProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText(/domain/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId('domain-picker-expand'));
    domains.forEach(domain => {
      expect(screen.getByText(domain as string)).toBeInTheDocument();
    });
  });

  it('renders unique options in alphabetical order', async () => {
    render(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApiRef]]}>
        <MockEntityListContextProvider value={{}}>
          <EntityDomainPicker />
        </MockEntityListContextProvider>
      </TestApiProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText(/domain/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId('domain-picker-expand'));

    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
      'domain1',
      'domain2',
      'domain3',
    ]);
  });

  it('select a value from filter', async () => {
    const updateFilters = jest.fn();
    render(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApiRef]]}>
        <MockEntityListContextProvider
          value={{
            updateFilters,
          }}
        >
          <EntityDomainPicker />
        </MockEntityListContextProvider>
      </TestApiProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText(/domain/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByTestId('domain-picker-expand'));
    fireEvent.click(screen.getByText('domain1'));
    await waitFor(() =>
      expect(updateFilters).toHaveBeenLastCalledWith({
        option: new EntityFieldFilter(['domain1'], ['metadata', 'domain']),
      }),
    );
  });

  it('respects the query parameter filter value', async () => {
    const updateFilters = jest.fn();
    const queryParameters = { option: ['domain2'] };
    render(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApiRef]]}>
        <MockEntityListContextProvider
          value={{
            updateFilters,
            queryParameters,
          }}
        >
          <EntityDomainPicker />
        </MockEntityListContextProvider>
      </TestApiProvider>,
    );

    await waitFor(() =>
      expect(updateFilters).toHaveBeenLastCalledWith({
        option: new EntityFieldFilter(['domain2'], ['metadata', 'domain']),
      }),
    );
  });

  it('adds a value from available options to filters', async () => {
    const updateFilters = jest.fn();
    render(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApiRef]]}>
        <MockEntityListContextProvider
          value={{
            updateFilters,
          }}
        >
          <EntityDomainPicker />
        </MockEntityListContextProvider>
      </TestApiProvider>,
    );
    await waitFor(() =>
      expect(updateFilters).toHaveBeenLastCalledWith({
        option: undefined,
      }),
    );

    fireEvent.click(screen.getByTestId('domain-picker-expand'));
    fireEvent.click(screen.getByText('domain1'));
    expect(updateFilters).toHaveBeenLastCalledWith({
      option: new EntityFieldFilter(['domain1'], ['metadata', 'domain']),
    });
  });

  it('removes a value from filters', async () => {
    const updateFilters = jest.fn();
    render(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApiRef]]}>
        <MockEntityListContextProvider
          value={{
            updateFilters,
            filters: {
              option: new EntityFieldFilter(
                ['domain1'],
                ['metadata', 'domain'],
              ),
            },
          }}
        >
          <EntityDomainPicker />
        </MockEntityListContextProvider>
      </TestApiProvider>,
    );
    await waitFor(() =>
      expect(updateFilters).toHaveBeenLastCalledWith({
        option: new EntityFieldFilter(['domain1'], ['metadata', 'domain']),
      }),
    );
    fireEvent.click(screen.getByTestId('domain-picker-expand'));
    expect(screen.getByLabelText('domain1')).toBeChecked();

    fireEvent.click(screen.getByLabelText('domain1'));
    expect(updateFilters).toHaveBeenLastCalledWith({
      option: undefined,
    });
  });

  it('responds to external queryParameters changes', async () => {
    const updateFilters = jest.fn();
    const rendered = render(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApiRef]]}>
        <MockEntityListContextProvider
          value={{
            updateFilters,
            queryParameters: { option: ['domain2'] },
          }}
        >
          <EntityDomainPicker />
        </MockEntityListContextProvider>
      </TestApiProvider>,
    );

    await waitFor(() =>
      expect(updateFilters).toHaveBeenLastCalledWith({
        option: new EntityFieldFilter(['domain2'], ['metadata', 'domain']),
      }),
    );
    rendered.rerender(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApiRef]]}>
        <MockEntityListContextProvider
          value={{
            updateFilters,
            queryParameters: { option: ['domain1'] },
          }}
        >
          <EntityDomainPicker />
        </MockEntityListContextProvider>
      </TestApiProvider>,
    );
    expect(updateFilters).toHaveBeenLastCalledWith({
      option: new EntityFieldFilter(['domain1'], ['metadata', 'domain']),
    });
  });
});
