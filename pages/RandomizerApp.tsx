import React from "react"
import { Toaster } from "react-hot-toast"
import {
  Chart,
  Unilab0731,
  JamFizz0603,
  VersionFolder,
  BemaniFolder,
} from "popn-db-js"
import ControlPanel, { ControlPanelState } from "../components/ControlPanel"
import SetList from "../components/SetList"
import {
  ChartDisplayOptions,
  parseChartDisplayStyle,
} from "../components/ChartDisplay"
import styles from "./RandomizerApp.module.scss"
import {
  getStorageBoolean,
  getStorageNumber,
  getStorageString,
  setStorageItem,
  setStorageItemIfNull,
} from "../lib/storage"
import {
  ChartDrawOptions,
  parseIncludeOption,
} from "../components/ChartDrawOptions"

type RandomizerAppProps = Record<string, never>

interface RandomizerAppState {
  isDoneLoading: boolean
  chartDataSets: Chart[][]
  chartDrawOptions: Partial<ChartDrawOptions>
  chartDisplayOptions: ChartDisplayOptions
}

export interface ChartQuerySampleOptions {
  count: number
  query: string
  gameVersion: string
}

const MAX_DRAWN_CHARTS = 1000

function deserializeChartSets(
  chartSetsJson: string,
): Chart[][] {
  try {
    const parsed = JSON.parse(chartSetsJson)
    if (!Array.isArray(parsed)) {
      return []
    }

    // Cull for max drawn charts. Keep latest chart sets.
    // Note the reverse iteration order and the unshift:
    // Chart sets are stored and serialized earliest-first but displayed latest-first.

    const deserializedChartSets: Chart[][] = []
    let deserializedChartCount = 0
    for (let nextItem of parsed.toReversed()) {
      if (nextItem === undefined || nextItem === null || (!Array.isArray(nextItem) && !Array.isArray(nextItem.charts))) {
        break
      }

      let nextChartIds: string[]
      let nextDatabase
      if (Array.isArray(nextItem)) { // Compatibility for old serialization format
        nextChartIds = nextItem
        nextDatabase = JamFizz0603 // Fallback
      } else {
        nextChartIds = nextItem.charts
        nextDatabase = getDatabase(nextItem.gameVersion)
      }
      if ((deserializedChartCount + nextChartIds.length) > MAX_DRAWN_CHARTS) {
        break
      }

      const nextCharts = nextDatabase.findCharts(...nextChartIds).filter((c) => c !== null) as Chart[]
      deserializedChartSets.unshift(nextCharts)
      deserializedChartCount += nextItem.length
    }

    return deserializedChartSets
  } catch (e) {
    console.error(`Error deserializing chart sets: ${e}`)
    // Comment out for now. If an error happens, we want to be able to repro.
    // setStorageItem("drawnChartSets", "[]")
    // console.info("Reset chart sets.")
    return []
  }
}

function serializeChartSets(chartSets: Chart[][]): string {
  const chartIdSets: string[][] = chartSets.map((set) =>
    set.map((chart) => chart.id),
  )
  return JSON.stringify(chartIdSets)
}

function getDatabase(gameVersion: string) {
  switch (gameVersion) {
    // versions with extras
    case "unilab_0913":
    case "unilab_1220":
    case "unilab_0905":
    case "unilab_1218":
    case "jamfizz_0925":
    case "jamfizz_0603":
      return JamFizz0603
    // versions without extras
    case "kaimei_0613":
    case "unilab_0411":
    case "unilab_0731":
      return Unilab0731
    default:
      console.error(`Unknown game version ${gameVersion}`)
      return Unilab0731
  }
}

export default class RandomizerApp extends React.Component<
  RandomizerAppProps,
  RandomizerAppState
> {
  constructor(props: RandomizerAppProps) {
    super(props)

    this.state = {
      isDoneLoading: false,
      chartDataSets: [],
      chartDisplayOptions: {
        sranModeEnabled: false,
        preferGenre: false,
        showChartDetails: false,
        displayStyle: "normal",
        notepadContents: "",
        assetsUrl: "",
      },
      chartDrawOptions: {},
    }
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.handleUnload)

    // Draw options
    setStorageItemIfNull("count", 5)
    setStorageItemIfNull("levelAdv", "")
    setStorageItemIfNull("sranLevelAdv", "")
    setStorageItemIfNull("includeDiffsRadio", "all")
    setStorageItemIfNull("includeDiffs", "enhx")
    setStorageItemIfNull("folder", "")
    setStorageItemIfNull("onlyIncludeHardest", false)
    setStorageItemIfNull("holdNotes", "include")
    setStorageItemIfNull("buggedBpms", "include")
    setStorageItemIfNull("eemall", "include")
    setStorageItemIfNull("floorInfection", "include")
    setStorageItemIfNull("omnimix", "exclude")
    setStorageItemIfNull("lively", "exclude")
    setStorageItemIfNull("gameVersion", "unilab_0731")

    // Migration for when a game version is replaced with a newer one
    if (getStorageString("gameVersion") === "jamfizz_0925") {
      setStorageItem("gameVersion", "jamfizz_0603")
    }

    // Display options
    setStorageItemIfNull("sranModeEnabled", false)
    setStorageItemIfNull("preferGenre", false)
    setStorageItemIfNull("showChartDetails", false)
    setStorageItemIfNull("displayStyle", "normal")
    setStorageItemIfNull("notepadContents", "")
    // State
    setStorageItemIfNull("drawnChartSets", "[]")

    const gameVersion = getStorageString("gameVersion")

    this.setState({
      isDoneLoading: true,
      chartDataSets: deserializeChartSets(
        getStorageString("drawnChartSets"),
      ),
      chartDisplayOptions: {
        sranModeEnabled: getStorageBoolean("sranModeEnabled"),
        preferGenre: getStorageBoolean("preferGenre"),
        showChartDetails: getStorageBoolean("showChartDetails"),
        displayStyle: parseChartDisplayStyle(getStorageString("displayStyle")),
        notepadContents: getStorageString("notepadContents").trim(),
        // Currently not configurable in the UI.
        assetsUrl: "https://popn-assets.pages.dev/assets",
      },
      chartDrawOptions: {
        count: getStorageNumber("count"),
        // TODO: Remove this temp backwards compatibility by end of month.
        levelAdv:
          getStorageString("level") || getStorageString("levelAdv") || "",
        sranLevelAdv:
          getStorageString("sranLevel") ||
          getStorageString("sranLevelAdv") ||
          "",
        includeDiffsRadio: getStorageString("includeDiffsRadio", "all") as
          | "all"
          | "choose",
        includeDiffs: getStorageString("includeDiffs"),
        hardestDiff: parseIncludeOption(getStorageString("hardestDiff")),
        folder:
          (getStorageString("folder") as VersionFolder | BemaniFolder) || "",
        eemall: parseIncludeOption(getStorageString("eemall")),
        floorInfection: parseIncludeOption(getStorageString("floorInfection")),
        buggedBpms: parseIncludeOption(getStorageString("buggedBpms")),
        holdNotes: parseIncludeOption(getStorageString("holdNotes")),
        omnimix: parseIncludeOption(getStorageString("omnimix")),
        lively: parseIncludeOption(getStorageString("lively")),
        gameVersion,
      },
    })
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.handleUnload)
  }

  handleUnload = (event: BeforeUnloadEvent) => {
    const { chartDataSets } = this.state
    const drawnChartCount = chartDataSets.reduce((currCount, nextSet) => currCount + nextSet.length, 0)
    if (drawnChartCount > MAX_DRAWN_CHARTS) {
      event.preventDefault()
    }
  }

  onControlPanelDraw = (querySampleOptions: ChartQuerySampleOptions) => {
    console.log(querySampleOptions)
    const database = getDatabase(querySampleOptions.gameVersion)
    const newChartDataSet = database.sampleQueriedCharts(querySampleOptions)

    this.setState((prevState) => {
      const newChartSets = [...prevState.chartDataSets, newChartDataSet]

      setStorageItem("drawnChartSets", serializeChartSets(newChartSets))
      return {
        chartDataSets: newChartSets,
      }
    })
  }

  onControlPanelClear = () => {
    setStorageItem("drawnChartSets", "[]")
    this.setState({
      chartDataSets: [],
    })
  }

  onControlPanelChange = (newControlPanelState: Partial<ControlPanelState>) => {
    this.setState((prevState) => ({
      chartDisplayOptions: {
        ...prevState.chartDisplayOptions,
        ...newControlPanelState,
      },
    }))
    Object.entries(newControlPanelState).forEach(([key, value]) => {
      setStorageItem(key, value)
    })
  }

  render() {
    const {
      isDoneLoading,
      chartDataSets,
      chartDrawOptions,
      chartDisplayOptions,
    } = this.state

    return (
      <section id="app" className={styles.App}>
        {isDoneLoading && (
          <section className={styles.body}>
            <ControlPanel
              extraClass={styles.controlPanel}
              initialDrawOptions={chartDrawOptions}
              initialDisplayOptions={chartDisplayOptions}
              onDraw={this.onControlPanelDraw}
              onClear={this.onControlPanelClear}
              onChange={this.onControlPanelChange}
            />
            <SetList
              extraClass={styles.setList}
              chartDataSets={chartDataSets}
              chartDisplayOptions={chartDisplayOptions}
            />
            <Toaster position="bottom-center" />
          </section>
        )}
      </section>
    )
  }
}
