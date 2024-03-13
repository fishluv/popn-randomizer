import React from "react"
import { Toaster } from "react-hot-toast"
import { Chart, Unilab0411, Unilab1218, parseSranLevel } from "popn-db-js"
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
  deserializeVersionFolders,
  serializeVersionFolders,
  ALL_VERSION_FOLDERS,
} from "../components/ChartDrawOptions"
import { parseIncludeOptionSafe } from "../components/parse"

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
    const sets: string[][] = parsed.filter(Array.isArray).slice(0, 20)

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
    case "unilab_0913":
    case "unilab_1220":
    case "unilab_0905":
    case "unilab_1218":
      return Unilab1218
    case "kaimei_0613":
    case "unilab_0411":
      return Unilab0411
    default:
      console.error(`Unknown game version ${gameVersion}`)
      return Unilab0411
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
    setStorageItemIfNull("levelMin", 30)
    setStorageItemIfNull("levelMax", 40)
    setStorageItemIfNull("levelEmhEnabled", false)
    setStorageItemIfNull("levelMinEmh", "e")
    setStorageItemIfNull("levelMaxEmh", "h")
    setStorageItemIfNull("sranLevelMin", "01a")
    setStorageItemIfNull("sranLevelMax", "05")
    setStorageItemIfNull("includeDiffsRadio", "all")
    setStorageItemIfNull("includeDiffs", "enhx")
    setStorageItemIfNull("versionFoldersRadio", "all")
    setStorageItemIfNull(
      "versionFolders",
      serializeVersionFolders(ALL_VERSION_FOLDERS),
    )
    setStorageItemIfNull("onlyIncludeHardest", false)
    setStorageItemIfNull("holdNotes", "include")
    setStorageItemIfNull("buggedBpms", "include")
    setStorageItemIfNull("eemall", "include")
    setStorageItemIfNull("floorInfection", "include")
    setStorageItemIfNull("omnimix", "exclude")
    setStorageItemIfNull("lively", "exclude")
    setStorageItemIfNull("gameVersion", "unilab_0411")
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
        levelMin: getStorageNumber("levelMin"),
        levelMax: getStorageNumber("levelMax"),
        levelEmhEnabled: getStorageBoolean("levelEmhEnabled"),
        levelMinEmh: getStorageString("levelMinEmh") as "e" | "m" | "h",
        levelMaxEmh: getStorageString("levelMaxEmh") as "e" | "m" | "h",
        sranLevelMin: parseSranLevel(getStorageString("sranLevelMin", "01a")),
        sranLevelMax: parseSranLevel(getStorageString("sranLevelMax", "05")),
        includeDiffsRadio: getStorageString("includeDiffsRadio", "all") as
          | "all"
          | "choose",
        includeDiffs: getStorageString("includeDiffs"),
        hardestDiff: parseIncludeOptionSafe(getStorageString("hardestDiff")),
        versionFoldersRadio: getStorageString("versionFoldersRadio", "all") as
          | "all"
          | "choose",
        versionFolders: deserializeVersionFolders(
          getStorageString("versionFolders"),
        ),
        eemall: parseIncludeOptionSafe(getStorageString("eemall")),
        floorInfection: parseIncludeOptionSafe(
          getStorageString("floorInfection"),
        ),
        buggedBpms: parseIncludeOptionSafe(getStorageString("buggedBpms")),
        holdNotes: parseIncludeOptionSafe(getStorageString("holdNotes")),
        omnimix: parseIncludeOptionSafe(getStorageString("omnimix")),
        lively: parseIncludeOptionSafe(getStorageString("lively")),
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
      if (key === "versionFolders") {
        setStorageItem(key, serializeVersionFolders(value as boolean[]))
      } else {
        setStorageItem(key, value)
      }
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
