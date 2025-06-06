/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { StoryObj } from '@storybook/react';
import type { ComponentProps, ComponentType } from 'react';
import React from 'react';
import { MockApmPluginStorybook } from '../../../context/apm_plugin/mock_apm_plugin_storybook';
import { DependencyLink } from './dependency_link';

type Args = ComponentProps<typeof DependencyLink>;

export default {
  title: 'shared/DependencyLink',
  component: DependencyLink,
  decorators: [
    (StoryComponent: ComponentType) => {
      return (
        <MockApmPluginStorybook>
          <StoryComponent />
        </MockApmPluginStorybook>
      );
    },
  ],
};

export const Example: StoryObj<Args> = {
  render: (args) => {
    return <DependencyLink {...args} />;
  },

  args: {
    query: {
      dependencyName: 'postgres',
      environment: 'ENVIRONMENT_ALL',
      kuery: '',
      rangeFrom: 'now-15m',
      rangeTo: 'now',
      comparisonEnabled: false,
    },
  },
};
