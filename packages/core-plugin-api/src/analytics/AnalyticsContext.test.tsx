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

import React from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import {
  AnalyticsContext,
  useAnalyticsContext,
  withAnalyticsContext,
} from './AnalyticsContext';

const AnalyticsSpy = ({ prop = '' }: { prop?: string }) => {
  const context = useAnalyticsContext();
  return (
    <>
      <div data-testid="route-ref">{context.routeRef}</div>
      <div data-testid="plugin-id">{context.pluginId}</div>
      <div data-testid="extension">{context.extension}</div>
      <div data-testid="custom">{context.custom}</div>
      <div data-testid="prop">{prop}</div>
    </>
  );
};

describe('AnalyticsContext', () => {
  describe('useAnalyticsContext', () => {
    it('returns default values', () => {
      const { result } = renderHook(() => useAnalyticsContext());
      expect(result.current).toEqual({
        extension: 'App',
        pluginId: 'root',
        routeRef: 'unknown',
      });
    });
  });

  describe('AnalyticsContext', () => {
    it('uses default analytics context', () => {
      const result = render(
        <AnalyticsContext attributes={{}}>
          <AnalyticsSpy />
        </AnalyticsContext>,
      );

      expect(result.getByTestId('extension')).toHaveTextContent('App');
      expect(result.getByTestId('plugin-id')).toHaveTextContent('root');
      expect(result.getByTestId('route-ref')).toHaveTextContent('unknown');
    });

    it('uses provided analytics context', () => {
      const result = render(
        <AnalyticsContext attributes={{ pluginId: 'custom' }}>
          <AnalyticsSpy />
        </AnalyticsContext>,
      );

      expect(result.getByTestId('extension')).toHaveTextContent('App');
      expect(result.getByTestId('plugin-id')).toHaveTextContent('custom');
      expect(result.getByTestId('route-ref')).toHaveTextContent('unknown');
    });

    it('uses nested analytics context', () => {
      const result = render(
        <AnalyticsContext attributes={{ pluginId: 'custom' }}>
          <AnalyticsContext attributes={{ extension: 'AnalyticsSpy' }}>
            <AnalyticsSpy />
          </AnalyticsContext>
        </AnalyticsContext>,
      );

      expect(result.getByTestId('extension')).toHaveTextContent('AnalyticsSpy');
      expect(result.getByTestId('plugin-id')).toHaveTextContent('custom');
      expect(result.getByTestId('route-ref')).toHaveTextContent('unknown');
    });
  });

  describe('withAnalyticsContext', () => {
    it('uses the default analytics context', () => {
      const Composed = withAnalyticsContext(AnalyticsSpy, {});
      const result = render(<Composed />);

      expect(result.getByTestId('extension')).toHaveTextContent('App');
      expect(result.getByTestId('plugin-id')).toHaveTextContent('root');
      expect(result.getByTestId('route-ref')).toHaveTextContent('unknown');
    });

    it('uses provided analytics context', () => {
      const Composed = withAnalyticsContext(AnalyticsSpy, {
        pluginId: 'custom',
      });
      const result = render(<Composed prop="some-prop" />);

      expect(result.getByTestId('extension')).toHaveTextContent('App');
      expect(result.getByTestId('plugin-id')).toHaveTextContent('custom');
      expect(result.getByTestId('route-ref')).toHaveTextContent('unknown');
      expect(result.getByTestId('prop')).toHaveTextContent('some-prop');
    });

    it('is able to render inlined components without explicit types', () => {
      const Composed = withAnalyticsContext(
        ({ prop }) => <div data-testid="prop">{prop}</div>,
        { extension: 'test' },
      );
      const result = render(<Composed prop="some-prop" />);
      expect(result.getByTestId('prop')).toHaveTextContent('some-prop');
    });
  });
});
