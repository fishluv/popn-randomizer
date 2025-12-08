import cx from "classnames"
import React from "react"
import ChartSet from "./ChartSet"
import styles from "./SetList.module.scss"
import { ChartDisplayOptions } from "./ChartDisplay"
import { ChartDataSet } from "../pages/RandomizerApp"

interface SetListProps {
  extraClass?: string
  chartDataSets: ChartDataSet[]
  chartDisplayOptions: ChartDisplayOptions
}

export default function SetList({
  extraClass,
  chartDataSets,
  chartDisplayOptions,
}: SetListProps) {
  return (
    <section className={cx(extraClass, styles.SetList)}>
      {chartDataSets.map((chartDataSet, index) => (
        <ChartSet
          key={index}
          extraClass={styles.borderBetween}
          chartDataSet={chartDataSet}
          index={index}
          chartDisplayOptions={chartDisplayOptions}
        />
      ))}
    </section>
  )
}
