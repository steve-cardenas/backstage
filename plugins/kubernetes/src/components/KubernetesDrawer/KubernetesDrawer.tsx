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
import React, { ChangeEvent, useState } from 'react';

import { CodeSnippet } from '@backstage/core-components';
import { IObjectMeta } from '@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta';
import {
  createStyles,
  Drawer,
  makeStyles,
  Theme,
  Grid,
  IconButton,
  Switch,
  Typography,
  Button,
  withStyles,
  FormControlLabel,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import jsYaml from 'js-yaml';

const useDrawerContentStyles = makeStyles((_theme: Theme) =>
  createStyles({
    header: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    content: {
      height: '80%',
    },
    icon: {
      fontSize: 20,
    },
  }),
);

interface KubernetesObject {
  kind: string;
  metadata?: IObjectMeta;
}

interface KubernetesDrawerContentProps {
  close: () => void;
  kubernetesObject: KubernetesObject;
  header?: React.ReactNode;
  children?: React.ReactNode;
}

export const KubernetesDrawerContent = ({
  children,
  header,
  kubernetesObject,
  close,
}: KubernetesDrawerContentProps) => {
  const classes = useDrawerContentStyles();
  const [isYaml, setIsYaml] = useState<boolean>(false);

  return (
    <>
      <div className={classes.header}>
        <Grid
          container
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
        >
          <Grid item>
            <Typography variant="h5">
              {kubernetesObject.metadata?.name}
            </Typography>
          </Grid>
          <Grid item>{header}</Grid>
          <Grid item>
            <FormControlLabel
              control={
                <Switch
                  checked={isYaml}
                  onChange={event => {
                    setIsYaml(event.target.checked);
                  }}
                  name="YAML"
                />
              }
              label="YAML"
            />
          </Grid>
        </Grid>
        <IconButton
          key="dismiss"
          title="Close the drawer"
          onClick={() => close()}
          color="inherit"
        >
          <CloseIcon className={classes.icon} />
        </IconButton>
      </div>
      <div className={classes.content}>
        {isYaml && (
          <CodeSnippet language="yaml" text={jsYaml.dump(kubernetesObject)} />
        )}
        {!isYaml && children}
      </div>
    </>
  );
};

interface KubernetesDrawerProps {
  open?: boolean;
  kubernetesObject: KubernetesObject;
  label: React.ReactNode;
  drawerContentsHeader?: React.ReactNode;
  children?: React.ReactNode;
}

const useDrawerStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      width: '50%',
      justifyContent: 'space-between',
      padding: theme.spacing(2.5),
    },
  }),
);

const DrawerButton = withStyles({
  root: {
    padding: '6px 5px',
  },
  label: {
    textTransform: 'none',
  },
})(Button);

export const KubernetesDrawer = ({
  open,
  label,
  drawerContentsHeader,
  kubernetesObject,
  children,
}: KubernetesDrawerProps) => {
  const classes = useDrawerStyles();
  const [isOpen, setIsOpen] = useState<boolean>(open ?? false);

  const toggleDrawer = (e: ChangeEvent<{}>, newValue: boolean) => {
    e.stopPropagation();
    setIsOpen(newValue);
  };

  return (
    <>
      <DrawerButton onClick={() => setIsOpen(true)}>{label}</DrawerButton>
      <Drawer
        classes={{
          paper: classes.paper,
        }}
        anchor="right"
        open={isOpen}
        onClose={(e: any) => toggleDrawer(e, false)}
        onClick={event => event.stopPropagation()}
      >
        {isOpen && (
          <KubernetesDrawerContent
            header={drawerContentsHeader}
            kubernetesObject={kubernetesObject}
            children={children}
            close={() => setIsOpen(false)}
          />
        )}
      </Drawer>
    </>
  );
};
