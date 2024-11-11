import React from "react"
import { Toaster } from "react-hot-toast"
import {
  Chart,
  Unilab0731,
  JamFizz0925,
  parseSranLevel,
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

function deserializeChartSets(
  chartSetsJson: string,
  gameVersion: string,
): Chart[][] {
  const database = getDatabase(gameVersion)

  try {
    const parsed = JSON.parse(chartSetsJson)
    if (!Array.isArray(parsed)) {
      return []
    }

    // Max is 20 sets and 10 charts per set.
    const sets: string[][] = parsed
      .filter(Array.isArray)
      .slice(parsed.length - 20)

    return sets.map((set) => {
      const chartIds = set.filter((s) => typeof s === "string").slice(0, 10)
      const charts = database.findCharts(...chartIds)
      return charts.filter((c) => c !== null) as Chart[]
    })
  } catch (e) {
    console.error(`Error deserializing chart sets: ${e}`)
    setStorageItem("drawnChartSets", "[]")
    console.info("Reset chart sets.")
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
      return JamFizz0925
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
    // `level` and `levelAdv` should default to null.
    setStorageItemIfNull("sranLevelMin", "01a")
    setStorageItemIfNull("sranLevelMax", "05")
    setStorageItemIfNull("sranLevelRange", false)
    setStorageItemIfNull("includeDiffsRadio", "all")
    setStorageItemIfNull("includeDiffs", "enhx")
    // `folder` should default to null.
    setStorageItemIfNull("onlyIncludeHardest", false)
    setStorageItemIfNull("holdNotes", "include")
    setStorageItemIfNull("buggedBpms", "include")
    setStorageItemIfNull("eemall", "include")
    setStorageItemIfNull("floorInfection", "include")
    setStorageItemIfNull("omnimix", "exclude")
    setStorageItemIfNull("lively", "exclude")
    setStorageItemIfNull("gameVersion", "unilab_0731")
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
        gameVersion,
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
        level: getStorageString("level") || undefined,
        levelAdv: getStorageString("levelAdv") || undefined,
        sranLevelMin: parseSranLevel(getStorageString("sranLevelMin", "01a")),
        sranLevelMax: parseSranLevel(getStorageString("sranLevelMax", "05")),
        sranLevelRange: getStorageBoolean("sranLevelRange"),
        includeDiffsRadio: getStorageString("includeDiffsRadio", "all") as
          | "all"
          | "choose",
        includeDiffs: getStorageString("includeDiffs"),
        hardestDiff: parseIncludeOption(getStorageString("hardestDiff")),
        folder:
          (getStorageString("folder") as VersionFolder | BemaniFolder) ||
          undefined,
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
    // Max 20 sets.
    if (chartDataSets.length > 20) {
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
