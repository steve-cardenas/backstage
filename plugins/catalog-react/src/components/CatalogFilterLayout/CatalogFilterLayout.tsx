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

import React, { useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  Grid,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from '@material-ui/core';
import FilterListIcon from '@material-ui/icons/FilterList';
import { catalogReactTranslationRef } from '../../translation';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';

/** @public */
export const Filters = (props: {
  children: React.ReactNode;
  options?: {
    drawerBreakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
    drawerAnchor?: 'left' | 'right' | 'top' | 'bottom';
  };
}) => {
  const isScreenSmallerThanBreakpoint = useMediaQuery<Theme>(theme =>
    theme.breakpoints.down(props.options?.drawerBreakpoint ?? 'md'),
  );
  const theme = useTheme<Theme>();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);
  const { t } = useTranslationRef(catalogReactTranslationRef);

  return isScreenSmallerThanBreakpoint ? (
    <>
      <Button
        style={{ marginTop: theme.spacing(1), marginLeft: theme.spacing(1) }}
        onClick={() => setFilterDrawerOpen(true)}
        startIcon={<FilterListIcon />}
      >
        {t('filters')}
      </Button>
      <Drawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        anchor={props.options?.drawerAnchor ?? 'left'}
        disableAutoFocus
        keepMounted
        variant="temporary"
      >
        <Box m={2}>
          <Typography
            variant="h6"
            component="h2"
            style={{ marginBottom: theme.spacing(1) }}
          >
            {t('filters')}
          </Typography>
          {props.children}
        </Box>
      </Drawer>
    </>
  ) : (
    <Grid item lg={2}>
      {props.children}
    </Grid>
  );
};

/** @public */
export const Content = (props: { children: React.ReactNode }) => {
  return (
    <Grid item xs={12} lg={10}>
      {props.children}
    </Grid>
  );
};

/** @public */
export const CatalogFilterLayout = (props: { children: React.ReactNode }) => {
  return (
    <Grid container style={{ position: 'relative' }}>
      {props.children}
    </Grid>
  );
};

CatalogFilterLayout.Filters = Filters;
CatalogFilterLayout.Content = Content;
