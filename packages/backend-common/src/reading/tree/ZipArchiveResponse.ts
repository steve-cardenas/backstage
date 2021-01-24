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

import path from 'path';
import fs from 'fs-extra';
import unzipper, { Entry } from 'unzipper';
import archiver from 'archiver';
import { Readable } from 'stream';
import {
  ReadTreeResponse,
  ReadTreeResponseFile,
  ReadTreeResponseDirOptions,
} from '../types';

// Matches a directory name + one `/` at the start of any string,
// containing any character except / one or more times, and ending with a `/`
// e.g. Will match `dirA/` in `dirA/dirB/file.ext`
const directoryNameRegex = /^[^\/]+\//;

/**
 * Wraps a zip archive stream into a tree response reader.
 */
export class ZipArchiveResponse implements ReadTreeResponse {
  private read = false;

  constructor(
    private readonly stream: Readable,
    private readonly subPath: string,
    private readonly workDir: string,
    public readonly etag: string,
    private readonly filter?: (path: string) => boolean,
  ) {
    if (subPath) {
      if (!subPath.endsWith('/')) {
        this.subPath += '/';
      }
      if (subPath.startsWith('/')) {
        throw new TypeError(
          `ZipArchiveResponse subPath must not start with a /, got '${subPath}'`,
        );
      }
    }

    this.etag = etag;
  }

  // Make sure the input stream is only read once
  private onlyOnce() {
    if (this.read) {
      throw new Error('Response has already been read');
    }
    this.read = true;
  }

  // Will remove the top level dir name from the path since its name is hard to predetermine.
  private stripTopDirectory(path: string): string {
    return path.replace(directoryNameRegex, '');
  }

  // File path relative to the root extracted directory or a sub directory if subpath is set.
  private getInnerPath(path: string): string {
    return path.slice(this.subPath.length);
  }

  private shouldBeIncluded(entry: Entry): boolean {
    const strippedPath = this.stripTopDirectory(entry.path);

    if (this.subPath) {
      if (!strippedPath.startsWith(this.subPath)) {
        return false;
      }
    }
    if (this.filter) {
      return this.filter(this.getInnerPath(entry.path));
    }
    return true;
  }

  async files(): Promise<ReadTreeResponseFile[]> {
    this.onlyOnce();

    const files = Array<ReadTreeResponseFile>();

    await this.stream
      .pipe(unzipper.Parse())
      .on('entry', (entry: Entry) => {
        if (entry.type === 'Directory') {
          entry.resume();
          return;
        }

        if (this.shouldBeIncluded(entry)) {
          files.push({
            path: this.getInnerPath(this.stripTopDirectory(entry.path)),
            content: () => entry.buffer(),
          });
        } else {
          entry.autodrain();
        }
      })
      .promise();

    return files;
  }

  async archive(): Promise<Readable> {
    this.onlyOnce();

    if (!this.subPath) {
      return this.stream;
    }

    const archive = archiver('zip');
    await this.stream
      .pipe(unzipper.Parse())
      .on('entry', (entry: Entry) => {
        if (entry.type === 'File' && this.shouldBeIncluded(entry)) {
          archive.append(entry, { name: this.getInnerPath(entry.path) });
        } else {
          entry.autodrain();
        }
      })
      .promise();
    archive.finalize();

    return archive;
  }

  async dir(options?: ReadTreeResponseDirOptions): Promise<string> {
    this.onlyOnce();

    const dir =
      options?.targetDir ??
      (await fs.mkdtemp(path.join(this.workDir, 'backstage-')));

    await this.stream
      .pipe(unzipper.Parse())
      .on('entry', async (entry: Entry) => {
        // Ignore directory entries since we handle that with the file entries
        // as a zip can have files with directories without directory entries
        if (entry.type === 'File' && this.shouldBeIncluded(entry)) {
          const entryPath = this.getInnerPath(
            this.stripTopDirectory(entry.path),
          );
          const dirname = path.dirname(entryPath);
          if (dirname) {
            await fs.mkdirp(path.join(dir, dirname));
          }
          entry.pipe(fs.createWriteStream(path.join(dir, entryPath)));
        } else {
          entry.autodrain();
        }
      })
      .promise();

    return dir;
  }
}
