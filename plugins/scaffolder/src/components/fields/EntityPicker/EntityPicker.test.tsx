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

import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { CatalogApi, catalogApiRef } from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { FieldProps } from '@rjsf/core';
import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { EntityPicker } from './EntityPicker';
import { EntityPickerProps } from './schema';
import userEvent from '@testing-library/user-event';

const makeEntity = (kind: string, namespace: string, name: string): Entity => ({
  apiVersion: 'backstage.io/v1beta1',
  kind,
  metadata: { namespace, name },
});

describe('<EntityPicker />', () => {
  let entities: Entity[];
  const onChange = jest.fn();
  const schema = {};
  const required = false;
  let uiSchema: EntityPickerProps['uiSchema'];
  const rawErrors: string[] = [];
  const formData = undefined;

  let props: FieldProps;

  const catalogApi = {
    getEntities: jest.fn(async () => ({ items: entities })),
  } as Partial<CatalogApi> as jest.Mocked<CatalogApi>;
  let Wrapper: React.ComponentType<React.PropsWithChildren<{}>>;

  beforeEach(() => {
    entities = [
      makeEntity('Group', 'default', 'team-a'),
      makeEntity('Group', 'default', 'squad-b'),
    ];

    Wrapper = ({ children }: { children?: React.ReactNode }) => (
      <TestApiProvider apis={[[catalogApiRef, catalogApi]]}>
        {children}
      </TestApiProvider>
    );
  });

  afterEach(() => jest.resetAllMocks());

  describe('without allowedKinds and catalogFilter', () => {
    beforeEach(() => {
      uiSchema = { 'ui:options': {} };
      props = {
        onChange,
        schema,
        required,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('searches for all entities', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      expect(catalogApi.getEntities).toHaveBeenCalledWith(undefined);
    });

    it('updates even if there is not an exact match', async () => {
      const { getByRole } = await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      const input = getByRole('textbox');

      fireEvent.change(input, { target: { value: 'squ' } });
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith('squ');
    });
  });

  describe('with allowedKinds', () => {
    beforeEach(() => {
      uiSchema = { 'ui:options': { allowedKinds: ['User'] } };
      props = {
        onChange,
        schema,
        required,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('searches for users and groups', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      expect(catalogApi.getEntities).toHaveBeenCalledWith({
        filter: {
          kind: ['User'],
        },
      });
    });
  });

  describe('with catalogFilter', () => {
    beforeEach(() => {
      uiSchema = {
        'ui:options': {
          catalogFilter: [
            {
              kind: ['Group'],
              'metadata.name': 'test-entity',
            },
            {
              kind: ['User'],
              'metadata.name': 'test-entity',
            },
          ],
        },
      };
      props = {
        onChange,
        schema,
        required,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('searches for a specific group entity', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      expect(catalogApi.getEntities).toHaveBeenCalledWith({
        filter: [
          {
            kind: ['Group'],
            'metadata.name': 'test-entity',
          },
          {
            kind: ['User'],
            'metadata.name': 'test-entity',
          },
        ],
      });
    });
    it('allow single top level filter', async () => {
      uiSchema = {
        'ui:options': {
          catalogFilter: {
            kind: ['Group'],
            'metadata.name': 'test-entity',
          },
        },
      };

      catalogApi.getEntities.mockResolvedValue({ items: entities });

      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} uiSchema={uiSchema} />
        </Wrapper>,
      );

      expect(catalogApi.getEntities).toHaveBeenCalledWith({
        filter: {
          kind: ['Group'],
          'metadata.name': 'test-entity',
        },
      });
    });

    it('search for entitities containing an specific key', async () => {
      const uiSchemaWithBoolean = {
        'ui:options': {
          catalogFilter: [
            {
              kind: ['User'],
              'metadata.annotation.some/anotation': { exists: true },
            },
          ],
        },
      };

      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} uiSchema={uiSchemaWithBoolean} />
        </Wrapper>,
      );

      expect(catalogApi.getEntities).toHaveBeenCalledWith({
        filter: [
          {
            kind: ['User'],
            'metadata.annotation.some/anotation': CATALOG_FILTER_EXISTS,
          },
        ],
      });
    });
  });

  describe('catalogFilter should take precedence over allowedKinds', () => {
    beforeEach(() => {
      uiSchema = {
        'ui:options': {
          catalogFilter: [
            {
              kind: ['Group'],
              'metadata.name': 'test-group',
            },
          ],
          allowedKinds: ['User'],
        },
      };
      props = {
        onChange,
        schema,
        required,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('searches for a Group entity', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      expect(catalogApi.getEntities).toHaveBeenCalledWith({
        filter: [
          {
            kind: ['Group'],
            'metadata.name': 'test-group',
          },
        ],
      });
    });
  });

  describe('uses full entity ref', () => {
    beforeEach(() => {
      uiSchema = {
        'ui:options': {
          defaultKind: 'Group',
        },
      };
      props = {
        onChange,
        schema,
        required,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('returns the full entityRef when entity exists in the list', async () => {
      const { getByRole } = await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      const input = getByRole('textbox');

      fireEvent.change(input, { target: { value: 'team-a' } });
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith('group:default/team-a');
    });

    it('returns the full entityRef when entity does not exist in the list', async () => {
      const { getByRole } = await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      const input = getByRole('textbox');

      fireEvent.change(input, { target: { value: 'team-b' } });
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith('group:default/team-b');
    });
  });

  describe('Required EntityPicker', () => {
    beforeEach(() => {
      uiSchema = {
        'ui:options': {
          catalogFilter: [
            {
              kind: ['Group'],
              'metadata.name': 'test-entity',
            },
            {
              kind: ['User'],
              'metadata.name': 'test-entity',
            },
          ],
        },
      };
      props = {
        onChange,
        schema,
        required: true,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('User enters clear input', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
          <div data-testid="outside">Outside</div>
        </Wrapper>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(input).toHaveValue('');
    });

    it('User selects item', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'team-a' } });
      fireEvent.blur(input);

      expect(input).toHaveValue('team-a');
      expect(onChange).toHaveBeenCalledWith('team-a');
    });

    it('User selects item and enters clear input', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
          <div data-testid="outside">Outside</div>
        </Wrapper>,
      );

      // Open the Autocomplete dropdown
      const input = screen.getByRole('textbox');
      fireEvent.click(input);

      // Select an option from the dropdown
      fireEvent.change(input, { target: { value: 'team-a' } });

      // Close the dropdown by clicking outside the Autocomplete component
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      // Click back into the Autocomplete component
      fireEvent.click(input);

      // Verify that the selected option is displayed in the input
      expect(input).toHaveValue('team-a');

      // Click the Clear button to clear the input
      const clearButton = screen.getByLabelText('Clear');
      fireEvent.click(clearButton);

      // Verify that the input is empty
      expect(input).toHaveValue('');

      // Verify that the handleChange function was called with undefined
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Optional EntityPicker', () => {
    beforeEach(() => {
      uiSchema = {
        'ui:options': {
          catalogFilter: [
            {
              kind: ['Group'],
              'metadata.name': 'test-entity',
            },
            {
              kind: ['User'],
              'metadata.name': 'test-entity',
            },
          ],
        },
      };
      props = {
        onChange,
        schema,
        required: false,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('User enters clear input', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
          <div data-testid="outside">Outside</div>
        </Wrapper>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(input).toHaveValue('');
    });

    it('User selects item', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'team-a' } });
      fireEvent.blur(input);

      expect(input).toHaveValue('team-a');
      expect(onChange).toHaveBeenCalledWith('team-a');
    });

    it('User selects item and enters clear input', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
          <div data-testid="outside">Outside</div>
        </Wrapper>,
      );

      // Open the Autocomplete dropdown
      const input = screen.getByRole('textbox');
      fireEvent.click(input);

      // Select an option from the dropdown
      fireEvent.change(input, { target: { value: 'team-a' } });

      // Close the dropdown by clicking outside the Autocomplete component
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      // Click back into the Autocomplete component
      fireEvent.click(input);

      // Verify that the selected option is displayed in the input
      expect(input).toHaveValue('team-a');

      // Click the Clear button to clear the input
      const clearButton = screen.getByLabelText('Clear');
      fireEvent.click(clearButton);

      // Verify that the input is empty
      expect(input).toHaveValue('');

      // Verify that the handleChange function was called with undefined
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Required Free Solo', () => {
    beforeEach(() => {
      uiSchema = {
        'ui:options': {
          catalogFilter: [
            {
              kind: ['Group'],
              'metadata.name': 'test-entity',
            },
            {
              kind: ['User'],
              'metadata.name': 'test-entity',
            },
          ],
        },
        allowArbitraryValues: true,
      };
      props = {
        onChange,
        schema,
        required: true,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('User enters clear input', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
          <div data-testid="outside">Outside</div>
        </Wrapper>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(input).toHaveValue('');
    });

    it('User selects item', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'team-a' } });
      fireEvent.blur(input);

      expect(input).toHaveValue('team-a');
      expect(onChange).toHaveBeenCalledWith('team-a');
    });

    it('User selects item and enters clear input', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
          <div data-testid="outside">Outside</div>
        </Wrapper>,
      );

      // Open the Autocomplete dropdown
      const input = screen.getByRole('textbox');
      fireEvent.click(input);

      // Select an option from the dropdown
      fireEvent.change(input, { target: { value: 'team-a' } });

      // Close the dropdown by clicking outside the Autocomplete component
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      // Click back into the Autocomplete component
      fireEvent.click(input);

      // Verify that the selected option is displayed in the input
      expect(input).toHaveValue('team-a');

      // Click the Clear button to clear the input
      const clearButton = screen.getByLabelText('Clear');
      fireEvent.click(clearButton);

      // Verify that the input is empty
      expect(input).toHaveValue('');

      // Verify that the handleChange function was called with undefined
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Optional Free Solo', () => {
    beforeEach(() => {
      uiSchema = {
        'ui:options': {
          catalogFilter: [
            {
              kind: ['Group'],
              'metadata.name': 'test-entity',
            },
            {
              kind: ['User'],
              'metadata.name': 'test-entity',
            },
          ],
        },
        allowArbitraryValues: true,
      };
      props = {
        onChange,
        schema,
        required: false,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('User enters clear input', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
          <div data-testid="outside">Outside</div>
        </Wrapper>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(input).toHaveValue('');
    });

    it('User selects item', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'team-a' } });
      fireEvent.blur(input);

      expect(input).toHaveValue('team-a');
      expect(onChange).toHaveBeenCalledWith('team-a');
    });

    it('User selects item and enters clear input', async () => {
      await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
          <div data-testid="outside">Outside</div>
        </Wrapper>,
      );

      // Open the Autocomplete dropdown
      const input = screen.getByRole('textbox');
      fireEvent.click(input);

      // Select an option from the dropdown
      fireEvent.change(input, { target: { value: 'team-a' } });

      // Close the dropdown by clicking outside the Autocomplete component
      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      // Click back into the Autocomplete component
      fireEvent.click(input);

      // Verify that the selected option is displayed in the input
      expect(input).toHaveValue('team-a');

      // Click the Clear button to clear the input
      const clearButton = screen.getByLabelText('Clear');
      fireEvent.click(clearButton);

      // Verify that the input is empty
      expect(input).toHaveValue('');

      // Verify that the handleChange function was called with undefined
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('with nameTemplate', () => {
    beforeEach(() => {
      uiSchema = {
        'ui:options': {
          allowArbitraryValues: false,
          nameTemplate:
            'XXX ${{entity.metadata.name}} ${{entity.metadata.namespace}}',
        },
      };
      props = {
        onChange,
        schema,
        required,
        uiSchema,
        rawErrors,
        formData,
      } as unknown as FieldProps;

      catalogApi.getEntities.mockResolvedValue({ items: entities });
    });

    it('names should be resolved', async () => {
      const { getByRole } = await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      const input = getByRole('textbox');
      await userEvent.click(input);

      expect(screen.getByText('XXX team-a default')).toBeInTheDocument();

      await userEvent.click(screen.getByText('XXX squad-b default'));
      expect(onChange).toHaveBeenCalledWith('group:default/squad-b');
    });

    it('do not update if there is not an exact match', async () => {
      const { getByRole } = await renderInTestApp(
        <Wrapper>
          <EntityPicker {...props} />
        </Wrapper>,
      );

      const input = getByRole('textbox');

      fireEvent.change(input, { target: { value: 'squ' } });
      fireEvent.blur(input);

      expect(onChange).not.toHaveBeenCalledWith();
    });
  });
});
