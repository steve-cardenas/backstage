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

import { Command } from 'commander';
import { paths } from '../lib/paths';
import { ESLint } from 'eslint';

export default async (cmd: Command, cmdArgs: string[]) => {
  const cmdOptions = cmd.opts();

  const eslint = new ESLint({
    cwd: paths.targetDir,
    fix: cmdOptions.fix,
    extensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
  });

  const results = await eslint.lintFiles(cmdArgs ?? ['.']);

  if (cmdOptions.fix) {
    await ESLint.outputFixes(results);
  }

  const formatter = await eslint.loadFormatter(cmdOptions.format);

  // This formatter uses the cwd to format file paths, so let's have that happen from the root instead
  if (cmdOptions.format === 'eslint-formatter-friendly') {
    process.chdir(paths.targetRoot);
  }
  const resultText = formatter.format(results);

  // If there is any feedback at all, we treat it as a lint failure. This should be
  // consistent with our old behavior of passing `--max-warnings=0` when invoking eslint.
  if (resultText) {
    console.log(resultText);
    process.exit(1);
  }
};
