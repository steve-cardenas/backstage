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

import PromiseRouter from 'express-promise-router';
import { ApiRouter } from './router';
import { RequiredDoc } from './types';
import {
  ErrorRequestHandler,
  RequestHandler,
  NextFunction,
  Request,
  Response,
  json,
} from 'express';
import { InputError } from '@backstage/errors';
import { middleware as OpenApiValidator } from 'express-openapi-validator';

type PropertyOverrideRequest = Request & {
  [key: symbol]: string;
};

const baseUrlSymbol = Symbol();
const originalUrlSymbol = Symbol();

function validatorErrorTransformer(): ErrorRequestHandler {
  return (error: Error, _: Request, _2: Response, next: NextFunction) => {
    next(new InputError(error.message));
  };
}

export function getDefaultRouterMiddleware() {
  return [json()];
}

/**
 * Create a new OpenAPI router with some default middleware.
 * @param spec - Your OpenAPI spec imported as a JSON object.
 * @param validatorOptions - `openapi-express-validator` options to override the defaults.
 * @returns A new express router with validation middleware.
 * @public
 */
export function createValidatedOpenApiRouter<T extends RequiredDoc>(
  spec: T,
  options?: {
    validatorOptions?: Partial<Parameters<typeof OpenApiValidator>['0']>;
    middleware?: RequestHandler[];
  },
) {
  const router = PromiseRouter() as ApiRouter<typeof spec>;
  router.use(options?.middleware || getDefaultRouterMiddleware());

  /**
   * Middleware to setup the routing for OpenApiValidator. OpenApiValidator expects `req.originalUrl`
   *    and `req.baseUrl` to be the full path. We adjust them here to basically be nothing and then
   *    revive the old values in the last function in this method. We could instead update `req.path`
   *    but that might affect the routing and I'd rather not.
   *
   * TODO: I opened https://github.com/cdimascio/express-openapi-validator/issues/843
   *    to track this on the middleware side, but there was a similar ticket, https://github.com/cdimascio/express-openapi-validator/issues/113
   *    that has had minimal activity. If that changes, update this to use a new option on their side.
   */
  router.use((req: Request, _, next) => {
    /**
     * Express typings are weird. They don't recognize PropertyOverrideRequest as a valid
     *  Request child and try to overload as PathParams. Just cast it here, since we know
     *  what we're doing.
     */
    const customRequest = req as PropertyOverrideRequest;
    customRequest[baseUrlSymbol] = customRequest.baseUrl;
    customRequest.baseUrl = '';
    customRequest[originalUrlSymbol] = customRequest.originalUrl;
    customRequest.originalUrl = customRequest.url;
    next();
  });

  // TODO: Handle errors by converting from OpenApiValidator errors to known @backstage/errors errors.
  router.use(
    OpenApiValidator({
      validateRequests: {
        coerceTypes: false,
        allowUnknownQueryParameters: false,
      },
      ignoreUndocumented: true,
      validateResponses: false,
      ...options?.validatorOptions,
      apiSpec: spec as any,
    }),
  );

  /**
   * Revert `req.baseUrl` and `req.originalUrl` changes. This ensures that any further usage
   *    of these variables will be unchanged.
   */
  router.use((req: Request, _, next) => {
    const customRequest = req as PropertyOverrideRequest;
    customRequest.baseUrl = customRequest[baseUrlSymbol];
    customRequest.originalUrl = customRequest[originalUrlSymbol];
    delete customRequest[baseUrlSymbol];
    delete customRequest[originalUrlSymbol];
    next();
  });

  // Any errors from the middleware get through here.
  router.use(validatorErrorTransformer());

  return router;
}
