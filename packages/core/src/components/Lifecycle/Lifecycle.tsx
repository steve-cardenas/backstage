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

import React, { FC } from 'react';
import CSS from 'csstype';
import { makeStyles } from '@material-ui/core';

type Props = CSS.Properties & {
  isShorthand?: boolean;
  isAlpha?: boolean;
};

const useStyles = makeStyles({
  alpha: {
    color: '#d00150',
    fontFamily: 'serif',
    fontWeight: 'normal',
    fontStyle: 'italic',
  },
  beta: {
    color: '#4d65cc',
    fontFamily: 'serif',
    fontWeight: 'normal',
    fontStyle: 'italic',
  },
});

export const Lifecycle: FC<Props> = props => {
  const classes = useStyles(props);
  const { isShorthand, isAlpha } = props;
  return isShorthand ? (
    <span className={classes.beta} style={{ fontSize: '120%' }}>
      {isAlpha ? <>&alpha;</> : <>&beta;</>}
    </span>
  ) : (
    <span className={classes.beta}>{isAlpha ? 'Alpha' : 'Beta'}</span>
  );
};
