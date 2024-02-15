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

import React, { useEffect } from 'react';

import { Table, TableProps } from '@backstage/core-components';
import { CatalogTableRow } from './types';
import {
  EntityTextFilter,
  useEntityList,
} from '@backstage/plugin-catalog-react';

/**
 * @internal
 */
export function OffsetPaginatedCatalogTable(
  props: TableProps<CatalogTableRow>,
) {
  const { columns, data } = props;
  const { updateFilters, setLimit, setOffset, limit } = useEntityList();
  const [page, setPage] = React.useState(0);

  useEffect(() => {
    setOffset!(page * limit);
  }, [setOffset, page, limit]);

  return (
    <Table
      columns={columns}
      data={data}
      options={{
        paginationPosition: 'both',
        pageSizeOptions: [5, 10, 20, 50, 100],
        pageSize: limit,
        emptyRowsWhenPaging: false,
      }}
      onSearchChange={(searchText: string) =>
        updateFilters({
          text: searchText ? new EntityTextFilter(searchText) : undefined,
        })
      }
      page={page}
      onPageChange={newPage => {
        setPage(newPage);
      }}
      onRowsPerPageChange={pageSize => {
        setLimit(pageSize);
      }}
      totalCount={7} // TODO: Add real total count
      localization={{ pagination: { labelDisplayedRows: '' } }}
    />
  );
}
