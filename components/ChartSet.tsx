import React from "react"
import toast from "react-hot-toast"
import cx from "classnames"
import ChartCard from "./ChartCard"
import styles from "./ChartSet.module.scss"
import { ChartDisplayOptions } from "./ChartDisplay"
import { Chart } from "popn-db-js"
import { FaRegCopy } from "react-icons/fa"

interface ChartSetProps {
  extraClass?: string
  index: number
  charts: Chart[]
  chartDisplayOptions: ChartDisplayOptions
}

export default function ChartSet({
  extraClass,
  index,
  charts,
  chartDisplayOptions,
}: ChartSetProps) {
  const cycleClassname = styles[`cycle${index % 4}`]
  const rootClassname = cx(extraClass, styles.ChartSet, cycleClassname)

  const noCharts = <span>No charts</span>

  const chartCardsMarkup = charts.map((chartData) => (
    <ChartCard
      key={`${chartData.id}_helper`}
      extraClass={styles.card}
      chartData={chartData}
      chartDisplayOptions={chartDisplayOptions}
    />
  ))

  async function onCopyButtonClick() {
    const chartsDump =
      charts
        .map(({ title, genre, difficulty, level }) => {
          let parts: string[]
          if (title === genre) {
            parts = [title, difficulty.toUpperCase(), level.toString()]
          } else {
            parts = [
              title,
              `(${genre})`,
              difficulty.toUpperCase(),
              level.toString(),
            ]
          }
          return parts.join(" ")
        })
        .join("\n") + "\n"
    await navigator.clipboard.writeText(chartsDump)
    toast(`Copied chart set:\n\n${chartsDump}`)
  }

  return (
    <section className={rootClassname}>
      <div className={styles.triangle}></div>

      {chartCardsMarkup.length ? (
        <button className={styles.copyButton} onClick={onCopyButtonClick}>
          <FaRegCopy />
        </button>
      ) : null}

      <div className={styles.cardsContainer}>
        {chartCardsMarkup.length ? chartCardsMarkup : noCharts}
      </div>
    </section>
  )
}
