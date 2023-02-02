import React from 'react';
import { ComponentMeta } from '@storybook/react';

import RandomizerApp from '../pages/RandomizerApp';

export default {
  title: 'Pages/RandomizerApp',
  component: RandomizerApp,
} as ComponentMeta<typeof RandomizerApp>;

export const Default = () => <RandomizerApp />;
