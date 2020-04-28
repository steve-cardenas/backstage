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

import React from 'react';
import MaterialTable, { SubvalueCell } from './MaterialTable';
import InfoCard from '../../layout/InfoCard';

export default {
  title: 'Material Table',
  component: MaterialTable,
  decorators: [story => <InfoCard title="Table">{story()}</InfoCard>],
};

const generateTestData: (number) => Array<{}> = (rows = 20) => {
  const data: Array<{}> = [];
  while (data.length <= rows) {
    data.push({
      col1: `Some value ${data.length}`,
      col2: `More data ${data.length}`,
      subvalue: `Subvalue ${data.length}`,
      number: Math.floor(Math.random() * 1000),
      date: new Date(Math.random() * 10000000000000),
    });
  }

  return data;
};

const testColumns = [
  {
    title: 'Column 1',
    customFilterAndSearch: (query, row) =>
      (row.col1 + ' ' + row.subvalue)
        .toUpperCase()
        .includes(query.toUpperCase()),
    customSort: (rowA, rowB) => {
      const a = rowA.col1;
      const b = rowB.col1;

      if (a !== b) {
        if (!a) return -1;
        if (!b) return 1;
      }
      return a < b ? -1 : a > b ? 1 : 0;
    },
    highlight: true,
    render: row => <SubvalueCell value={row.col1} subvalue={row.subvalue} />,
  },
  {
    title: 'Column 2',
    field: 'col2',
  },
  {
    title: 'Numeric value',
    field: 'number',
    type: 'numeric',
  },
  {
    title: 'A Date',
    field: 'date',
    type: 'date',
  },
];

const testData100 = generateTestData(100);

export const DefaultTable = () => {
  return (
    <MaterialTable
      options={{ paging: false }}
      data={testData100}
      columns={testColumns}
    />
  );
};

export const HiddenFilterTable = () => {
  return (
    <MaterialTable
      options={{ paging: false }}
      data={testData100}
      columns={testColumns}
    />
  );
};
