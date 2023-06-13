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

import { JsonObject } from '@backstage/types';
import { FormProps } from '@rjsf/core';
import { UiSchema } from '@rjsf/utils';
import type { LayoutOptions } from '@backstage/plugin-scaffolder-react';

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractUiSchema(schema: JsonObject, uiSchema: JsonObject) {
  if (!isObject(schema)) {
    return;
  }

  const { properties, items, anyOf, oneOf, allOf, dependencies } = schema;

  for (const propName in schema) {
    if (!schema.hasOwnProperty(propName)) {
      continue;
    }

    if (propName.startsWith('ui:')) {
      uiSchema[propName] = schema[propName];
      delete schema[propName];
    }
  }

  if (isObject(properties)) {
    for (const propName in properties) {
      if (!properties.hasOwnProperty(propName)) {
        continue;
      }

      const schemaNode = properties[propName];
      if (!isObject(schemaNode)) {
        continue;
      }
      const innerUiSchema = {};
      uiSchema[propName] = uiSchema[propName] || innerUiSchema;
      extractUiSchema(schemaNode, innerUiSchema);
    }
  }

  if (isObject(items)) {
    const innerUiSchema = {};
    uiSchema.items = innerUiSchema;
    extractUiSchema(items, innerUiSchema);
  }

  if (Array.isArray(anyOf)) {
    for (const schemaNode of anyOf) {
      if (!isObject(schemaNode)) {
        continue;
      }
      extractUiSchema(schemaNode, uiSchema);
    }
  }

  if (Array.isArray(oneOf)) {
    for (const schemaNode of oneOf) {
      if (!isObject(schemaNode)) {
        continue;
      }
      extractUiSchema(schemaNode, uiSchema);
    }
  }

  if (Array.isArray(allOf)) {
    for (const schemaNode of allOf) {
      if (!isObject(schemaNode)) {
        continue;
      }
      extractUiSchema(schemaNode, uiSchema);
    }
  }

  if (isObject(dependencies)) {
    for (const depName of Object.keys(dependencies)) {
      const schemaNode = dependencies[depName];
      if (!isObject(schemaNode)) {
        continue;
      }
      extractUiSchema(schemaNode, uiSchema);
    }
  }
}

export function transformSchemaToProps(
  inputSchema: JsonObject,
  layouts: LayoutOptions[] = [],
): {
  schema: FormProps<any>['schema'];
  uiSchema: FormProps<any>['uiSchema'];
} {
  const customLayoutName = inputSchema['ui:ObjectFieldTemplate'];
  inputSchema.type = inputSchema.type || 'object';
  const schema = JSON.parse(JSON.stringify(inputSchema));
  delete schema.title; // Rendered separately
  const uiSchema: UiSchema = {};
  extractUiSchema(schema, uiSchema);

  if (customLayoutName) {
    const Layout = layouts.find(
      layout => layout.name === customLayoutName,
    )?.component;

    if (Layout) {
      uiSchema['ui:ObjectFieldTemplate'] = Layout;
    }
  }

  return { schema, uiSchema };
}
