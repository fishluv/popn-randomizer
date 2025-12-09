import cx from "classnames"
import React from "react"
import toast from "react-hot-toast"
import ReactModal from "react-modal"
import ChartSet from "./ChartSet"
import styles from "./SetList.module.scss"
import { ChartDisplayOptions } from "./ChartDisplay"
import { ChartDataSet } from "../pages/RandomizerApp"
import { FaRegCopy } from "react-icons/fa"
import { FiMoreVertical } from "react-icons/fi"

ReactModal.setAppElement("#app")

interface SetListProps {
  extraClass?: string
  chartDataSets: ChartDataSet[]
  chartDisplayOptions: ChartDisplayOptions
}

interface SetListState {
  openedChartSetIndex: number
}

export default class SetList extends React.Component<
  SetListProps,
  SetListState
> {
  constructor(props: SetListProps) {
    super(props)

    this.state = {
      openedChartSetIndex: -1,
    }
  }

  onCopyButtonClick = async () => {
    const { chartDataSets } = this.props
    const { openedChartSetIndex } = this.state
    const { charts } = chartDataSets[openedChartSetIndex]

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

  render() {
    const { extraClass, chartDataSets, chartDisplayOptions } = this.props
    const { openedChartSetIndex } = this.state

    return (
      <section className={cx(extraClass, styles.SetList)}>
        {chartDataSets.map((chartDataSet, index) => (
          // Use drawnAt for key. Fall back to index for old data.
          <div
            key={chartDataSet.drawnAt || index}
            className={styles.chartSetAndButton}
          >
            <ChartSet
              extraClass={styles.borderBetween}
              chartDataSet={chartDataSet}
              index={index}
              chartDisplayOptions={chartDisplayOptions}
            />

            <button
              className={styles.moreButton}
              title="More chart set actions"
              onClick={() => this.setState({ openedChartSetIndex: index })}
            >
              <FiMoreVertical strokeWidth="2" />
            </button>
          </div>
        ))}

        <ReactModal
          isOpen={openedChartSetIndex >= 0}
          contentLabel="Chart set controls modal"
          onRequestClose={() => this.setState({ openedChartSetIndex: -1 })}
          style={{
            overlay: { zIndex: 10 },
            content: {
              position: "absolute",
              top: "30%",

              margin: "0 auto",
              padding: "1rem",
              width: "300px",
              height: "fit-content",

              background: "#fdfdfd",

              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            },
          }}
        >
          <>
            <button title="More actions" onClick={this.onCopyButtonClick}>
              <FaRegCopy /> Copy to clipboard
            </button>
          </>
        </ReactModal>
      </section>
    )
  }
}
