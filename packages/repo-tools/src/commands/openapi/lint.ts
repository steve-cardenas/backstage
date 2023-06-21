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

import {
  Spectral,
  Document,
  Ruleset,
  RulesetDefinition,
} from '@stoplight/spectral-core';
import { Yaml } from '@stoplight/spectral-parsers';
import ruleset from '@apisyouwonthate/style-guide';
import fs from 'fs-extra';
import chalk from 'chalk';
import { resolve } from 'path';
import { runner } from './runner';
import { YAML_SCHEMA_PATH } from './constants';
import { oas } from '@stoplight/spectral-rulesets';
import { DiagnosticSeverity } from '@stoplight/types';
import { pretty } from '@stoplight/spectral-formatters';

async function lint(
  directoryPath: string,
  config?: { skipMissingYamlFile: boolean; strict: boolean },
) {
  const { skipMissingYamlFile, strict } = config ?? {};
  const openapiPath = resolve(directoryPath, YAML_SCHEMA_PATH);
  if (!(await fs.pathExists(openapiPath))) {
    if (skipMissingYamlFile) {
      return;
    }
    throw new Error(`Could not find a file at ${openapiPath}.`);
  }
  const openapiFileContent = await fs.readFile(openapiPath, 'utf8');

  const document = new Document(openapiFileContent, Yaml, openapiPath);

  const spectral = new Spectral();

  const backstageRuleset = new Ruleset(
    {
      extends: [oas, ruleset],
      overrides: [
        {
          files: ['*'],
          rules: {
            'api-health': 'off',
            'api-home': 'off',
            'api-home-get': 'off',
            'operation-tags': 'off',
            'hosts-https-only-oas3': 'off',
            'no-unknown-error-format': 'off',
          },
        },
      ],
    } as RulesetDefinition,
    { source: openapiPath },
  );

  spectral.setRuleset(backstageRuleset);
  // we lint our document using the ruleset we passed to the Spectral object
  const result = await spectral.run(document);
  const errors = result.filter(e => e.severity === DiagnosticSeverity.Error);
  const numberOfErrors = (strict && result.length) || errors.length;
  if (numberOfErrors > 0) {
    console.error(
      pretty(result, {
        // Used to fulfill the types, but not used for prettier output.
        failSeverity: DiagnosticSeverity.Error,
      }),
    );
    throw new Error(`${numberOfErrors} error(s) found when linting your spec.`);
  }
}

export async function bulkCommand(
  paths: string[] = [],
  options: { strict?: boolean },
): Promise<void> {
  const resultsList = await runner(paths, (dir: string) =>
    lint(dir, { skipMissingYamlFile: true, strict: !!options.strict }),
  );

  let failed = false;
  for (const { relativeDir, resultText } of resultsList) {
    if (resultText) {
      console.log();
      console.log(
        chalk.red(`OpenAPI yaml file linting failed in ${relativeDir}:`),
      );
      console.log(resultText.trimStart());

      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  } else {
    console.log(chalk.green('Linted all files.'));
  }
}
