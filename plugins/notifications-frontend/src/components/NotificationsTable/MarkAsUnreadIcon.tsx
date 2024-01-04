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
import React from 'react';

import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  svg: {
    width: 'auto',
    height: 24,
  },
  path: {
    fill: '#7df3e1',
  },
});

const MarkAsUnreadIcon = () => {
  const classes = useStyles();

  return (
    <svg
      className={classes.svg}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.475 23.3L17.525 20.35C16.725 20.8833 15.8625 21.2917 14.9375 21.575C14.0125 21.8583 13.0334 22 12 22C10.6167 22 9.31672 21.7375 8.10005 21.2125C6.88338 20.6875 5.82505 19.975 4.92505 19.075C4.02505 18.175 3.31255 17.1167 2.78755 15.9C2.26255 14.6833 2.00005 13.3833 2.00005 12C2.00005 10.9667 2.14172 9.9875 2.42505 9.0625C2.70838 8.1375 3.11672 7.275 3.65005 6.475L0.675049 3.5L2.10005 2.075L21.9 21.875L20.475 23.3ZM20.375 17.5L15.05 12.15L17.65 9.55L16.25 8.15L13.65 10.775L6.50005 3.625C7.30005 3.10833 8.16255 2.70833 9.08755 2.425C10.0125 2.14167 10.9834 2 12 2C13.3834 2 14.6834 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 13.0167 21.8584 13.9875 21.575 14.9125C21.2917 15.8375 20.8917 16.7 20.375 17.5ZM10.6 16.6L12.2 15L10.8 13.6L10.6 13.8L7.75005 10.95L6.35005 12.35L10.6 16.6Z"
        fill="#181818"
      />
    </svg>
  );
};

export default MarkAsUnreadIcon;
