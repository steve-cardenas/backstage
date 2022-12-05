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
import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import myfile from './myfile.yaml';
import { stringify } from 'yaml';

const str = stringify(myfile);

export const ExampleComponent = () => (
  <Page themeId="tool">
    <Header title="Welcome to synth-react!" subtitle="Optional subtitle">
      <HeaderLabel label="Owner" value="Team X" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <ContentHeader title="Backstage Synth Playground">
        <SupportButton>You can get help in Frontside Discord</SupportButton>
      </ContentHeader>
      <Grid container spacing={3} direction="column">
        <Grid item>Main body</Grid>
      </Grid>
    </Content>
  </Page>
);
