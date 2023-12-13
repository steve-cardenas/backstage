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
import { z } from 'zod';
import {
  AuthorizeResult,
  PermissionCondition,
  PermissionCriteria,
} from './api';

/**
 * A zod schema to help validate permission conditions.
 * @public
 */
export const permissionConditionSchema: z.ZodSchema<PermissionCondition> =
  z.object({
    rule: z.string(),
    resourceType: z.string(),
    params: z.record(z.any()).optional(),
  });

/**
 * A zod schema to help validate permission criteria.
 * @public
 */
export const permissionCriteriaSchema: z.ZodSchema<
  PermissionCriteria<PermissionCondition>
> = z.lazy(() =>
  permissionConditionSchema
    .or(z.object({ anyOf: z.array(permissionCriteriaSchema).nonempty() }))
    .or(z.object({ allOf: z.array(permissionCriteriaSchema).nonempty() }))
    .or(z.object({ not: permissionCriteriaSchema })),
);

/**
 * A zod schema to help validate conditional policy decisions.
 * @public
 */
export const conditionalPolicyDecisionSchema = z.object({
  result: z.literal(AuthorizeResult.CONDITIONAL),
  pluginId: z.string().min(1),
  resourceType: z.string().min(1),
  conditions: permissionCriteriaSchema,
});

/**
 * A zod schema to help validate definitive policy decisions.
 * @public
 */
export const definitivePolicyDecisionSchema = z.object({
  result: z.union([
    z.literal(AuthorizeResult.ALLOW),
    z.literal(AuthorizeResult.DENY),
  ]),
});

/**
 * A zod schema to help validate policy decisions.
 * @public
 */
export const policyDecisionSchema = z.union([
  definitivePolicyDecisionSchema,
  conditionalPolicyDecisionSchema,
]);
