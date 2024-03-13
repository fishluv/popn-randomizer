import cx from "classnames"
import { Chart } from "popn-db-js"
import React from "react"
import ChartSet from "./ChartSet"
import styles from "./SetList.module.scss"
import { ChartDisplayOptions } from "./ChartDisplay"

interface SetListProps {
  extraClass?: string
  chartDataSets: Chart[][]
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
          charts={chartDataSet}
          index={index}
          chartDisplayOptions={chartDisplayOptions}
        />
      ))}
    </section>
  )
}
