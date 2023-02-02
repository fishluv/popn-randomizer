import React from 'react';
import cx from 'classnames';
import ChartCard from './ChartCard';
import styles from './ChartSet.module.scss';
import { ChartDisplayOptions } from './ChartDisplay';
import { Chart } from 'popn-db-js';

interface ChartSetProps {
  extraClass?: string;
  index: number;
  charts: Chart[];
  chartDisplayOptions: ChartDisplayOptions;
}

export default function ChartSet({
  extraClass,
  index,
  charts,
  chartDisplayOptions,
}: ChartSetProps) {
  const cycleClassname = styles[`cycle${index % 4}`];
  const rootClassname = cx(extraClass, styles.ChartSet, cycleClassname);

  const noCharts = <span>No charts</span>;

  const chartCardsMarkup = charts.map((chartData) => (
    <ChartCard
      key={`${chartData.id}_helper`}
      extraClass={styles.card}
      chartData={chartData}
      chartDisplayOptions={chartDisplayOptions}
    />
  ));

  return (
    <section className={rootClassname}>
      <div className={styles.triangle}></div>
      <div className={styles.cardsContainer}>
        {chartCardsMarkup.length ? chartCardsMarkup : noCharts}
      </div>
    </section>
  );
}
