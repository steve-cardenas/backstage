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

import { TestEventBroker } from '@backstage/plugin-events-backend-test-utils';
import { GerritEventRouter } from './GerritEventRouter';

describe('GerritEventRouter', () => {
  const eventRouter = new GerritEventRouter();
  const topic = 'gerrit';
  const eventPayload = { type: 'test-type', test: 'payload' };
  const metadata = {};

  it('no $.type', () => {
    const eventBroker = new TestEventBroker();
    eventRouter.setEventBroker(eventBroker);

    eventRouter.onEvent({
      topic,
      eventPayload: { invalid: 'payload' },
      metadata,
    });

    expect(eventBroker.published).toEqual([]);
  });

  it('with $.type', () => {
    const eventBroker = new TestEventBroker();
    eventRouter.setEventBroker(eventBroker);

    eventRouter.onEvent({ topic, eventPayload, metadata });

    expect(eventBroker.published.length).toBe(1);
    expect(eventBroker.published[0].topic).toEqual('gerrit.test-type');
    expect(eventBroker.published[0].eventPayload).toEqual(eventPayload);
    expect(eventBroker.published[0].metadata).toEqual(metadata);
  });
});
