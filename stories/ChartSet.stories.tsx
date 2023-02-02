import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Chart, Database } from 'popn-db-js'
import ChartSet from '../components/ChartSet';

export default {
  title: 'Components/ChartSet',
  component: ChartSet,
  args: {
    index: 0,
    isVetoed: false,
    chartDisplayOptions: {
      sranModeEnabled: false,
      preferGenre: false,
      showChartDetails: false,
      displayStyle: "normal",
      assetsUrl: 'https://popn-assets.surge.sh',
      showLinks: false,
      customLink1Url: '',
    },
  },
  argTypes: {
    isVetoed: { control: 'boolean' },
  },
} as ComponentMeta<typeof ChartSet>;

const Template: ComponentStory<typeof ChartSet> = (props) => <ChartSet {...props} />;
function templateFor(charts: Chart[]) {
  const template = Template.bind({});
  template.args = {
    charts,
  };
  return template;
}

const absolute = Database.findCharts('300n', '300h', '300ex');

export const NonEmpty = templateFor(absolute as Chart[]);
export const Empty = templateFor([]);
