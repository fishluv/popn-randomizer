import cx from "classnames"
import markdownit from "markdown-it"
import React from "react"
import ReactModal from "react-modal"
import {
  LEVELS,
  parseSranLevel,
  parseVersionFolder,
  SranLevel,
  SRAN_LEVELS,
  VERSION_FOLDERS,
} from "popn-db-js"
import styles from "./ControlPanel.module.scss"
import { ChartDisplayOptions } from "./ChartDisplay"
import { ChartQuerySampleOptions } from "../pages/RandomizerApp"
import {
  ChartDrawOptions,
  ALL_VERSION_FOLDERS,
  versionFoldersToQueryValue,
  NONE_VERSION_FOLDERS,
} from "./ChartDrawOptions"
import { parseIncludeOption, parseIncludeOptionSafe } from "./parse"
import FolderPill from "./FolderPill"
import { BsGithub } from "react-icons/bs"
import { FaTrash } from "react-icons/fa"
import { RiSettings3Fill } from "react-icons/ri"
import { VscTriangleLeft, VscTriangleRight } from "react-icons/vsc"

const md = markdownit({ html: false, breaks: true, linkify: true })
ReactModal.setAppElement("#app")

function range(start: number, stop: number) {
  let realStart: number
  let realStop: number
  if (stop === undefined) {
    realStart = 0
    realStop = start
  } else {
    realStart = start
    realStop = stop
  }

  const size = realStop - realStart
  return [...Array.from(Array(size).keys())].map((i) => i + realStart)
}

function emhToOrd(emh: "e" | "m" | "h") {
  return ["e", "m", "h"].indexOf(emh)
}

function emhFromOrd(ord: 0 | 1 | 2): "e" | "m" | "h" {
  return ["e", "m", "h"][ord] as "e" | "m" | "h"
}

function minEmh(...emhs: ("e" | "m" | "h")[]) {
  const ords = emhs.map(emhToOrd) as (0 | 1 | 2)[]
  const minOrd = Math.min(...ords) as 0 | 1 | 2
  return emhFromOrd(minOrd)
}

function maxEmh(...emhs: ("e" | "m" | "h")[]) {
  const ords = emhs.map(emhToOrd) as (0 | 1 | 2)[]
  const maxOrd = Math.max(...ords) as 0 | 1 | 2
  return emhFromOrd(maxOrd)
}

function normSranLevel(sranLv: string): string {
  return sranLv.replace("a", "-").replace("b", "+").replace(/^0+/, "")
}

function sranLevelMinusOne(sranLv: SranLevel): string {
  const index = SRAN_LEVELS.indexOf(sranLv!)
  const newIndex = Math.max(0, index - 1)
  return SRAN_LEVELS[newIndex]
}

function sranLevelPlusOne(sranLv: SranLevel): string {
  const index = SRAN_LEVELS.indexOf(sranLv!)
  const newIndex = Math.min(SRAN_LEVELS.length - 1, index + 1)
  return SRAN_LEVELS[newIndex]
}

function sranLevelCategory(sranLv?: SranLevel): string {
  const num = parseInt(sranLv ?? "0")
  if (num >= 19) {
    return "max"
  } else if (num >= 15) {
    return "veryhard"
  } else if (num >= 11) {
    return "hard"
  } else if (num >= 7) {
    return "mid"
  } else if (num >= 3) {
    return "easy"
  } else {
    return "veryeasy"
  }
}

const DRAW_COUNT_MIN = 1
const DRAW_COUNT_MAX = 10
const DRAW_COUNTS = range(DRAW_COUNT_MIN, DRAW_COUNT_MAX + 1)

interface ControlPanelOptions {
  isMoreControlsOpen: boolean
}

type ControlPanelProps = Partial<ControlPanelOptions> & {
  extraClass?: string
  initialDrawOptions: Partial<ChartDrawOptions>
  initialDisplayOptions: Partial<ChartDisplayOptions>
  onChange: (newState: Partial<ControlPanelState>) => void
  onDraw: (options: ChartQuerySampleOptions) => void
  onClear: () => void
}

export type ControlPanelState = ChartDrawOptions &
  Partial<ChartDisplayOptions> &
  ControlPanelOptions

export default class ControlPanel extends React.Component<
  ControlPanelProps,
  ControlPanelState
> {
  constructor(props: ControlPanelProps) {
    super(props)

    const {
      initialDrawOptions: {
        count,
        levelMin,
        levelMax,
        levelEmhEnabled,
        levelMinEmh,
        levelMaxEmh,
        sranLevelMin,
        sranLevelMax,
        includeDiffsRadio,
        includeDiffs,
        hardestDiff,
        versionFoldersRadio,
        versionFolders,
        eemall,
        floorInfection,
        buggedBpms,
        holdNotes,
        omnimix,
        lively,
        gameVersion,
      },
      initialDisplayOptions: {
        sranModeEnabled,
        preferGenre,
        showChartDetails,
        displayStyle,
        notepadContents,
        assetsUrl, // Currently not configurable in UI.
      },
      isMoreControlsOpen,
    } = props

    this.state = {
      // Draw options
      count: count || 4,
      levelMin: levelMin || 30,
      levelMax: levelMax || 40,
      levelEmhEnabled: levelEmhEnabled ?? false,
      levelMinEmh: levelMinEmh ?? "e",
      levelMaxEmh: levelMaxEmh ?? "h",
      sranLevelMin: sranLevelMin || "01a",
      sranLevelMax: sranLevelMax || "05",
      includeDiffsRadio: includeDiffsRadio ?? "all",
      includeDiffs: includeDiffs ?? "enhx",
      hardestDiff: hardestDiff ?? "include",
      versionFoldersRadio: versionFoldersRadio ?? "all",
      versionFolders: versionFolders ?? ALL_VERSION_FOLDERS.slice(),
      eemall: eemall ?? "include",
      floorInfection: floorInfection ?? "include",
      buggedBpms: buggedBpms ?? "include",
      holdNotes: holdNotes ?? "include",
      omnimix: omnimix ?? "exclude",
      lively: lively ?? "exclude",
      gameVersion: gameVersion || "unilab_0411",
      // Display options
      sranModeEnabled: sranModeEnabled ?? false,
      preferGenre: preferGenre ?? false,
      showChartDetails: showChartDetails ?? false,
      displayStyle: displayStyle ?? "normal",
      notepadContents: notepadContents ?? "",
      assetsUrl: assetsUrl || "https://popn-assets.pages.dev/assets",
      // Control panel state
      isMoreControlsOpen: isMoreControlsOpen ?? false,
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress)
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyPress)
  }

  handleKeyPress = (event: KeyboardEvent) => {
    const { isMoreControlsOpen } = this.state
    if (isMoreControlsOpen) return

    const { key, repeat } = event
    if (repeat) return

    if (key === "s") {
      this.openMoreControls()
    } else if (key === "d") {
      this.onDrawClick()
    }
  }

  getNewStateForNewLevelMin = (newMin: number, newMinEmh: "e" | "m" | "h") => {
    const { levelMax: prevMax, levelMaxEmh: prevMaxEmh } = this.state
    const newMax = Math.max(prevMax!, newMin)
    const newMaxEmh =
      newMin === newMax ? maxEmh(prevMaxEmh!, newMinEmh) : prevMaxEmh

    return {
      levelMin: newMin,
      levelMax: newMax,
      levelMinEmh: newMinEmh,
      levelMaxEmh: newMaxEmh,
    }
  }

  getNewStateForNewLevelMax = (newMax: number, newMaxEmh: "e" | "m" | "h") => {
    const { levelMin: prevMin, levelMinEmh: prevMinEmh } = this.state
    const newMin = Math.min(prevMin!, newMax)
    const newMinEmh =
      newMin === newMax ? minEmh(prevMinEmh!, newMaxEmh) : prevMinEmh

    return {
      levelMin: newMin,
      levelMax: newMax,
      levelMinEmh: newMinEmh,
      levelMaxEmh: newMaxEmh,
    }
  }

  getNewStateForNewSranLevelMin = (newSranMin: string) => {
    const { sranLevelMax: prevSranMax } = this.state
    const newSranMax = newSranMin > prevSranMax! ? newSranMin : prevSranMax!

    return {
      sranLevelMin: parseSranLevel(newSranMin),
      sranLevelMax: parseSranLevel(newSranMax),
    }
  }

  getNewStateForNewSranLevelMax = (newSranMax: string) => {
    const { sranLevelMin: prevSranMin } = this.state
    const newSranMin = newSranMax < prevSranMin! ? newSranMax : prevSranMin!

    return {
      sranLevelMin: parseSranLevel(newSranMin),
      sranLevelMax: parseSranLevel(newSranMax),
    }
  }

  onSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { levelMinEmh, levelMaxEmh } = this.state
    const { id, value } = event.target
    let newState

    // TODO: Probably shouldn't assume `type`
    // If new lower > prev upper, raise upper. If new upper < prev lower, decrease lower.
    // Ensures lower <= upper at all times.
    if (id === "drawCountSelect") {
      newState = {
        count: Number(value),
      }
    } else if (id === "levelLowerSelect") {
      newState = this.getNewStateForNewLevelMin(Number(value), levelMinEmh!)
    } else if (id === "levelUpperSelect") {
      newState = this.getNewStateForNewLevelMax(Number(value), levelMaxEmh!)
    } else if (id === "gameVersionSelect") {
      newState = {
        gameVersion: value,
      }
    } else if (id === "sranLevelLowerSelect") {
      newState = this.getNewStateForNewSranLevelMin(value)
    } else if (id === "sranLevelUpperSelect") {
      newState = this.getNewStateForNewSranLevelMax(value)
    } else if (id === "holdNotesSelect") {
      newState = {
        holdNotes: parseIncludeOptionSafe(value),
      }
    } else if (id === "buggedBpmsSelect") {
      newState = {
        buggedBpms: parseIncludeOptionSafe(value),
      }
    } else if (id === "eemallSelect") {
      newState = {
        eemall: parseIncludeOptionSafe(value),
      }
    } else if (id === "floorInfectionSelect") {
      newState = {
        floorInfection: parseIncludeOptionSafe(value),
      }
    } else if (id === "omnimixSelect") {
      newState = {
        omnimix: parseIncludeOptionSafe(value),
      }
    } else if (id === "livelySelect") {
      newState = {
        lively: parseIncludeOptionSafe(value),
      }
    } else {
      console.warn(`ControlPanel: Unknown id ${id}`)
      return
    }

    this.setState(newState)
    this.props.onChange(newState)
  }

  onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { includeDiffs, versionFolders } = this.state
    const { id, checked } = event.target
    let newState

    // TODO: Probably shouldn't assume `type`
    if (id === "displayGenreInput") {
      newState = { preferGenre: checked }
      this.setState(newState) // For type safety, can't put this outside the if block.
    } else if (id === "showChartDetailsInput") {
      newState = { showChartDetails: checked }
      this.setState(newState)
    } else if (id === "isLevelEmhEnabledInput") {
      newState = { levelEmhEnabled: checked }
      this.setState(newState)
    } else if (id === "isSranModeEnabledInput") {
      newState = { sranModeEnabled: checked }
      this.setState(newState)
    } else if (id === "includeAllDiffsInput" && checked) {
      newState = {
        includeDiffsRadio: "all" as const,
        includeDiffs: "enhx",
        hardestDiff: "include" as const,
      }
      this.setState(newState)
    } else if (id === "includeChooseDiffsInput" && checked) {
      newState = {
        includeDiffsRadio: "choose" as const,
      }
      this.setState(newState)
    } else if (id === "includeEasyInput") {
      newState = {
        includeDiffs: checked
          ? `${includeDiffs}e`
          : includeDiffs!.replace("e", ""),
      }
      this.setState(newState)
    } else if (id === "includeNormalInput") {
      newState = {
        includeDiffs: checked
          ? `${includeDiffs}n`
          : includeDiffs!.replace("n", ""),
      }
      this.setState(newState)
    } else if (id === "includeHyperInput") {
      newState = {
        includeDiffs: checked
          ? `${includeDiffs}h`
          : includeDiffs!.replace("h", ""),
      }
      this.setState(newState)
    } else if (id === "includeExInput") {
      newState = {
        includeDiffs: checked
          ? `${includeDiffs}x`
          : includeDiffs!.replace("x", ""),
      }
      this.setState(newState)
    } else if (id === "onlyIncludeHardestInput") {
      newState = {
        hardestDiff: checked
          ? parseIncludeOption("only")
          : parseIncludeOption("include"),
      }
      this.setState(newState)
    } else if (id === "includeAllFoldersInput" && checked) {
      newState = {
        versionFoldersRadio: "all" as const,
        versionFolders: ALL_VERSION_FOLDERS.slice(),
      }
      this.setState(newState)
    } else if (id === "includeChooseFoldersInput" && checked) {
      newState = {
        versionFoldersRadio: "choose" as const,
      }
      this.setState(newState)
    } else if (/folder(\d+)Input/.test(id)) {
      const folderNum = Number(id.match(/folder(\d+)Input/)![1])
      versionFolders![folderNum] = checked
      newState = { versionFolders }
      this.setState(newState)
    } else if (id === "displayStyleNormalInput") {
      newState = { displayStyle: "normal" as const }
      this.setState(newState)
    } else if (id === "displayStyleCompactInput") {
      newState = { displayStyle: "compact" as const }
      this.setState(newState)
    } else {
      console.warn(`ControlPanel: Unknown id ${id}`)
      return
    }

    this.props.onChange(newState)
  }

  onLevelButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const {
      levelMin: prevMin,
      levelMax: prevMax,
      levelMinEmh: prevMinEmh,
      levelMaxEmh: prevMaxEmh,
      sranLevelMin: prevSranMin,
      sranLevelMax: prevSranMax,
    } = this.state

    const { id } = event.currentTarget
    let newState

    if (id === "levelMinDownButton") {
      const newMin = Math.max(1, prevMin! - 1)
      newState = this.getNewStateForNewLevelMin(newMin, prevMinEmh!)
    } else if (id === "levelMinUpButton") {
      const newMin = Math.min(50, prevMin! + 1)
      newState = this.getNewStateForNewLevelMin(newMin, prevMinEmh!)
    } else if (id === "levelMaxDownButton") {
      const newMax = Math.max(1, prevMax! - 1)
      newState = this.getNewStateForNewLevelMax(newMax, prevMaxEmh!)
    } else if (id === "levelMaxUpButton") {
      const newMax = Math.min(50, prevMax! + 1)
      newState = this.getNewStateForNewLevelMax(newMax, prevMaxEmh!)
    } else if (id === "sranLevelMinDownButton") {
      const newSranMin = sranLevelMinusOne(prevSranMin!)
      newState = this.getNewStateForNewSranLevelMin(newSranMin)
    } else if (id === "sranLevelMinUpButton") {
      const newSranMin = sranLevelPlusOne(prevSranMin!)
      newState = this.getNewStateForNewSranLevelMin(newSranMin)
    } else if (id === "sranLevelMaxDownButton") {
      const newSranMax = sranLevelMinusOne(prevSranMax!)
      newState = this.getNewStateForNewSranLevelMax(newSranMax)
    } else if (id === "sranLevelMaxUpButton") {
      const newSranMax = sranLevelPlusOne(prevSranMax!)
      newState = this.getNewStateForNewSranLevelMax(newSranMax)
    } else {
      console.warn(`ControlPanel: Unknown id ${id}`)
      return
    }

    this.setState(newState)
    this.props.onChange(newState)
  }

  onLevelEmhButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const { levelMin: prevMin, levelMax: prevMax } = this.state
    const { id } = event.currentTarget
    let newState: {
      levelMinEmh?: "e" | "m" | "h"
      levelMaxEmh?: "e" | "m" | "h"
    }

    switch (id) {
      case "levelMinEmhButtonE":
        newState = this.getNewStateForNewLevelMin(prevMin!, "e")
        break
      case "levelMinEmhButtonM":
        newState = this.getNewStateForNewLevelMin(prevMin!, "m")
        break
      case "levelMinEmhButtonH":
        newState = this.getNewStateForNewLevelMin(prevMin!, "h")
        break
      case "levelMaxEmhButtonE":
        newState = this.getNewStateForNewLevelMax(prevMax!, "e")
        break
      case "levelMaxEmhButtonM":
        newState = this.getNewStateForNewLevelMax(prevMax!, "m")
        break
      case "levelMaxEmhButtonH":
        newState = this.getNewStateForNewLevelMax(prevMax!, "h")
        break
      default:
        console.warn(`ControlPanel: Unknown id ${id}`)
        return
    }

    this.setState(newState)
    this.props.onChange(newState)
  }

  onNoneVersionFoldersButtonClick = () => {
    const newState = {
      versionFolders: NONE_VERSION_FOLDERS.slice(),
    }
    this.setState(newState)
    this.props.onChange(newState)
  }

  onTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newState = {
      notepadContents: event.currentTarget.value,
    }
    this.setState(newState)
    this.props.onChange(newState)
  }

  onDrawClick = () => {
    const { onDraw } = this.props
    const {
      count,
      levelMin,
      levelMax,
      levelEmhEnabled,
      levelMinEmh,
      levelMaxEmh,
      sranModeEnabled,
      sranLevelMin,
      sranLevelMax,
      includeDiffs,
      hardestDiff,
      versionFolders,
      eemall,
      floorInfection,
      buggedBpms,
      holdNotes,
      omnimix,
      lively,
      gameVersion,
    } = this.state

    const querySegments = []

    if (sranModeEnabled) {
      querySegments.push(`srlv >= ${sranLevelMin}`)
      querySegments.push(`srlv <= ${sranLevelMax}`)
    } else {
      querySegments.push(
        `lv >= ${levelMin}${levelEmhEnabled ? levelMinEmh : ""}`,
      )
      querySegments.push(
        `lv <= ${levelMax}${levelEmhEnabled ? levelMaxEmh : ""}`,
      )
    }

    if (includeDiffs!.split("").sort().join("") !== "ehnx") {
      // TODO: api doesn't support none
      querySegments.push(`diff = ${includeDiffs}`)
    }

    if (buggedBpms === "only") {
      querySegments.push("buggedbpm")
    }
    if (buggedBpms === "exclude") {
      querySegments.push("-buggedbpm")
    }

    if (holdNotes === "only") {
      querySegments.push("holds")
    }
    if (holdNotes === "exclude") {
      querySegments.push("-holds")
    }

    if (eemall === "only") {
      querySegments.push("eemall")
    }
    if (eemall === "exclude") {
      querySegments.push("-eemall")
    }

    if (floorInfection === "only") {
      querySegments.push("floorinfection")
    }
    if (floorInfection === "exclude") {
      querySegments.push("-floorinfection")
    }

    if (gameVersion === "unilab_1218") {
      // These are only supported for newest non-Eagle datecodes.

      if (omnimix === "only") {
        querySegments.push("omnimix")
      }
      if (omnimix === "exclude") {
        querySegments.push("-omnimix")
      }

      if (lively === "only") {
        querySegments.push("lively")
      }
      if (lively === "exclude") {
        querySegments.push("-lively")
      }
    }

    // Put this late because it's somewhat expensive.
    if (!versionFolders!.every(Boolean)) {
      querySegments.push(`ver = ${versionFoldersToQueryValue(versionFolders!)}`)
    }

    // Put this last because it's the most expensive condition to evaluate.
    if (hardestDiff === "only") {
      querySegments.push("hardest")
    }

    onDraw({
      count: count!,
      query: querySegments.join(", "),
      gameVersion: gameVersion!,
    })
  }

  onClearClick = () => {
    const { onClear } = this.props

    if (window.confirm("Clear all drawn charts?")) {
      onClear()
    }
  }

  getLevelControls = () => {
    const {
      levelMin,
      levelMax,
      levelEmhEnabled,
      levelMinEmh,
      levelMaxEmh,
      sranModeEnabled,
      sranLevelMin,
      sranLevelMax,
    } = this.state

    if (sranModeEnabled) {
      return (
        <section className={cx(styles.control, styles.level)}>
          <label htmlFor="sranLevelLowerSelect">Sran level</label>

          <section className={styles.flex}>
            <button
              id="sranLevelMinDownButton"
              className={styles.levelDownButton}
              type="button"
              onClick={this.onLevelButtonClick}
            >
              <VscTriangleLeft />
            </button>
            <select
              id="sranLevelLowerSelect"
              className={styles[`sranlevel${sranLevelCategory(sranLevelMin)}`]}
              value={sranLevelMin!}
              onChange={this.onSelectChange}
            >
              {SRAN_LEVELS.map((sranLv: string) => (
                <option value={sranLv} key={sranLv}>
                  {normSranLevel(sranLv)}
                </option>
              ))}
            </select>
            <button
              id="sranLevelMinUpButton"
              className={styles.levelUpButton}
              type="button"
              onClick={this.onLevelButtonClick}
            >
              <VscTriangleRight />
            </button>
          </section>

          <label htmlFor="sranLevelUpperSelect">to</label>

          <section className={styles.flex}>
            <button
              id="sranLevelMaxDownButton"
              className={styles.levelDownButton}
              type="button"
              onClick={this.onLevelButtonClick}
            >
              <VscTriangleLeft />
            </button>
            <select
              id="sranLevelUpperSelect"
              className={styles[`sranlevel${sranLevelCategory(sranLevelMax)}`]}
              value={sranLevelMax!}
              onChange={this.onSelectChange}
            >
              {SRAN_LEVELS.map((sranLv: string) => (
                <option value={sranLv} key={sranLv}>
                  {normSranLevel(sranLv)}
                </option>
              ))}
            </select>
            <button
              id="sranLevelMaxUpButton"
              className={styles.levelUpButton}
              type="button"
              onClick={this.onLevelButtonClick}
            >
              <VscTriangleRight />
            </button>
          </section>
        </section>
      )
    }

    return (
      <>
        <section className={cx(styles.control, styles.level)}>
          <label htmlFor="levelLowerSelect">Level</label>

          <section>
            <section className={styles.flex}>
              <button
                id="levelMinDownButton"
                className={styles.levelDownButton}
                type="button"
                onClick={this.onLevelButtonClick}
              >
                <VscTriangleLeft />
              </button>
              <select
                id="levelLowerSelect"
                className={styles[`level${Math.floor((levelMin ?? 0) / 10)}x`]}
                value={levelMin}
                onChange={this.onSelectChange}
              >
                {LEVELS.map((level: number) => (
                  <option value={level} key={level}>
                    {level}
                  </option>
                ))}
              </select>
              <button
                id="levelMinUpButton"
                className={styles.levelUpButton}
                type="button"
                onClick={this.onLevelButtonClick}
              >
                <VscTriangleRight />
              </button>
            </section>

            {levelEmhEnabled && (
              <section className={styles.chooseLevelEmh}>
                <button
                  id="levelMinEmhButtonE"
                  className={cx(
                    styles.levelEmhButton,
                    styles.easy,
                    levelMinEmh === "e" ? styles.selected : "",
                  )}
                  type="button"
                  onClick={this.onLevelEmhButtonClick}
                >
                  e
                </button>
                <button
                  id="levelMinEmhButtonM"
                  className={cx(
                    styles.levelEmhButton,
                    styles.med,
                    levelMinEmh === "m" ? styles.selected : "",
                  )}
                  type="button"
                  onClick={this.onLevelEmhButtonClick}
                >
                  m
                </button>
                <button
                  id="levelMinEmhButtonH"
                  className={cx(
                    styles.levelEmhButton,
                    styles.hard,
                    levelMinEmh === "h" ? styles.selected : "",
                  )}
                  type="button"
                  onClick={this.onLevelEmhButtonClick}
                >
                  h
                </button>
              </section>
            )}
          </section>

          <label htmlFor="levelUpperSelect">to</label>

          <section>
            <section className={styles.flex}>
              <button
                id="levelMaxDownButton"
                className={styles.levelDownButton}
                type="button"
                onClick={this.onLevelButtonClick}
              >
                <VscTriangleLeft />
              </button>
              <select
                id="levelUpperSelect"
                className={styles[`level${Math.floor((levelMax ?? 0) / 10)}x`]}
                value={levelMax}
                onChange={this.onSelectChange}
              >
                {LEVELS.map((level: number) => (
                  <option value={level} key={level}>
                    {level}
                  </option>
                ))}
              </select>
              <button
                id="levelMaxUpButton"
                className={styles.levelUpButton}
                type="button"
                onClick={this.onLevelButtonClick}
              >
                <VscTriangleRight />
              </button>
            </section>

            {levelEmhEnabled && (
              <section className={styles.chooseLevelEmh}>
                <button
                  id="levelMaxEmhButtonE"
                  className={cx(
                    styles.levelEmhButton,
                    styles.easy,
                    levelMaxEmh === "e" ? styles.selected : "",
                  )}
                  type="button"
                  onClick={this.onLevelEmhButtonClick}
                >
                  e
                </button>
                <button
                  id="levelMaxEmhButtonM"
                  className={cx(
                    styles.levelEmhButton,
                    styles.med,
                    levelMaxEmh === "m" ? styles.selected : "",
                  )}
                  type="button"
                  onClick={this.onLevelEmhButtonClick}
                >
                  m
                </button>
                <button
                  id="levelMaxEmhButtonH"
                  className={cx(
                    styles.levelEmhButton,
                    styles.hard,
                    levelMaxEmh === "h" ? styles.selected : "",
                  )}
                  type="button"
                  onClick={this.onLevelEmhButtonClick}
                >
                  h
                </button>
              </section>
            )}
          </section>
        </section>

        <section className={styles.control}>
          <input
            id="isLevelEmhEnabledInput"
            type="checkbox"
            checked={levelEmhEnabled}
            onChange={this.onInputChange}
          />
          <label htmlFor="isLevelEmhEnabledInput">
            Filter by easy/medium/hard
          </label>
        </section>

        {levelEmhEnabled && (
          <section className={cx(styles.control, styles.info)}>
            Only supported for charts level 29+ that have ratings on popn.wiki.
          </section>
        )}
      </>
    )
  }

  getLevel = (level: number) => {
    return (
      <span
        className={cx(
          styles.levelString,
          styles[`level${Math.floor(level / 10)}x`],
        )}
      >
        {level}
      </span>
    )
  }

  getSranLevel = (sranLevel: SranLevel) => {
    return (
      <span
        className={cx(
          styles.sranLevelString,
          styles[`sranlevel${sranLevelCategory(sranLevel)}`],
        )}
      >
        {normSranLevel(sranLevel)}
      </span>
    )
  }

  getEmh = (emh: "e" | "m" | "h") => {
    const longName = {
      e: "easy",
      m: "med",
      h: "hard",
    }
    return (
      <span className={cx(styles.emhString, styles[longName[emh]])}>
        {longName[emh]}
      </span>
    )
  }

  getSummaryContents = () => {
    const {
      count,
      levelMin,
      levelMax,
      levelEmhEnabled,
      levelMinEmh,
      levelMaxEmh,
      sranModeEnabled,
      sranLevelMin,
      sranLevelMax,
    } = this.state

    if (sranModeEnabled) {
      if (sranLevelMin === sranLevelMax) {
        return (
          <>
            {count}
            {" songs, sran "}
            {this.getSranLevel(sranLevelMin!)}
          </>
        )
      }
      return (
        <>
          {count}
          {" songs, sran "}
          {this.getSranLevel(sranLevelMin!)}
          {"~"}
          {this.getSranLevel(sranLevelMax!)}
        </>
      )
    }

    if (levelEmhEnabled) {
      if (levelMin === levelMax) {
        if (levelMinEmh === levelMaxEmh) {
          return (
            <>
              {count}
              {" songs, "}
              {this.getLevel(levelMin!)}
              {this.getEmh(levelMinEmh!)}
            </>
          )
        } else {
          return (
            <>
              {count}
              {" songs, "}
              {this.getLevel(levelMin!)}
              {this.getEmh(levelMinEmh!)}
              {"~"}
              {this.getEmh(levelMaxEmh!)}
            </>
          )
        }
      } else {
        return (
          <>
            {count}
            {" songs, "}
            {this.getLevel(levelMin!)}
            {this.getEmh(levelMinEmh!)}
            {"~"}
            {this.getLevel(levelMax!)}
            {this.getEmh(levelMaxEmh!)}
          </>
        )
      }
    } else {
      if (levelMin === levelMax) {
        return (
          <>
            {count}
            {" songs, "}
            {this.getLevel(levelMin!)}
          </>
        )
      } else {
        return (
          <>
            {count}
            {" songs, "}
            {this.getLevel(levelMin!)}
            {"~"}
            {this.getLevel(levelMax!)}
          </>
        )
      }
    }
  }

  openMoreControls = () => {
    this.setState({
      isMoreControlsOpen: true,
    })
  }

  closeMoreControls = () => {
    this.setState({
      isMoreControlsOpen: false,
    })
  }

  resetControls = () => {
    if (
      window.confirm(
        "Reset options to default values? Display options will not be affected.",
      )
    ) {
      const newState: ChartDrawOptions & Partial<ChartDisplayOptions> = {
        // Draw options
        count: 4,
        levelMin: 30,
        levelMax: 40,
        levelEmhEnabled: false,
        levelMinEmh: "e",
        levelMaxEmh: "h",
        sranLevelMin: "01a",
        sranLevelMax: "05",
        includeDiffsRadio: "all",
        includeDiffs: "enhx",
        hardestDiff: "include",
        versionFoldersRadio: "all",
        versionFolders: ALL_VERSION_FOLDERS.slice(),
        eemall: "include",
        floorInfection: "include",
        buggedBpms: "include",
        holdNotes: "include",
        omnimix: "exclude",
        lively: "exclude",
        // Display options
        sranModeEnabled: false,
        // Don't reset game version or display options.
      }
      this.setState(newState)
      this.props.onChange(newState)
    }
  }

  render() {
    const { extraClass } = this.props
    const {
      count,
      includeDiffsRadio,
      includeDiffs,
      hardestDiff,
      versionFoldersRadio,
      versionFolders,
      eemall,
      floorInfection,
      buggedBpms,
      holdNotes,
      omnimix,
      lively,
      sranModeEnabled,
      gameVersion,
      preferGenre,
      displayStyle,
      notepadContents,
      isMoreControlsOpen,
    } = this.state

    const rootClassName = cx(extraClass, styles.ControlPanel)

    function includeOptions() {
      return (
        <>
          <option value="include">OK</option>
          <option value="exclude">Exclude</option>
          <option value="only">Require</option>
        </>
      )
    }

    return (
      <section className={rootClassName}>
        <section className={styles.buttonsAndSummary}>
          <section className={styles.left}>
            <button
              type="button"
              title="(shortcut: d)"
              onClick={this.onDrawClick}
            >
              Draw
            </button>

            <span className={styles.summary}>{this.getSummaryContents()}</span>
          </section>

          <section className={styles.right}>
            <button
              type="button"
              title="Settings (shortcut: s)"
              className={styles.iconButton}
              onClick={this.openMoreControls}
            >
              <RiSettings3Fill />
            </button>
          </section>
        </section>

        {notepadContents?.trim() && (
          <section
            className={styles.notepadContents}
            dangerouslySetInnerHTML={{
              __html: md.render(notepadContents),
            }}
          ></section>
        )}

        <ReactModal
          isOpen={isMoreControlsOpen}
          contentLabel="More controls modal"
          onRequestClose={this.closeMoreControls}
          style={{
            overlay: { zIndex: 10 },
            content: {
              background: "#fdfdfd",
              border: "none",
              boxShadow: "0 0 50px 50px #fdfdfd",
              inset: "0",
              margin: "0 auto",
              maxWidth: "400px",
              padding: "1rem",
              position: "absolute",
            },
          }}
        >
          <section className={styles.topRow}>
            <section>
              <button
                className={styles.closeMoreControlsButton}
                type="button"
                onClick={this.closeMoreControls}
              >
                Close
              </button>
            </section>

            <section className={styles.right}>
              <button
                className={cx(styles.iconButton, styles.clearButton)}
                type="button"
                title="Clear drawn charts"
                onClick={this.onClearClick}
              >
                <FaTrash />
              </button>

              <button
                className={styles.resetButton}
                type="button"
                onClick={this.resetControls}
              >
                Reset to defaults
              </button>
            </section>
          </section>

          <h5 className={styles.header}>Draw options</h5>
          <section className={cx(styles.control, styles.draw)}>
            <label htmlFor="drawCountSelect">Draw</label>
            <select
              id="drawCountSelect"
              value={count}
              onChange={this.onSelectChange}
            >
              {DRAW_COUNTS.map((count) => (
                <option value={count} key={count}>
                  {count}
                </option>
              ))}
            </select>
          </section>

          {this.getLevelControls()}

          <section className={styles.control}>
            <input
              id="isSranModeEnabledInput"
              type="checkbox"
              checked={sranModeEnabled}
              onChange={this.onInputChange}
            />
            <label htmlFor="isSranModeEnabledInput">Sran mode</label>
          </section>

          <section className={cx(styles.control, styles.includeDiffs)}>
            <span>Difficulties</span>

            <section className={styles.flex}>
              <input
                id="includeAllDiffsInput"
                type="radio"
                checked={includeDiffsRadio === "all"}
                onChange={this.onInputChange}
              />
              <label htmlFor="includeAllDiffsInput">All</label>
            </section>

            <section className={styles.flex}>
              <input
                id="includeChooseDiffsInput"
                type="radio"
                checked={includeDiffsRadio === "choose"}
                onChange={this.onInputChange}
              />
              <label htmlFor="includeChooseDiffsInput">Choose</label>
            </section>
          </section>

          {includeDiffsRadio === "choose" && (
            <>
              <section className={cx(styles.control, styles.diffsChoose)}>
                <div className={styles.diffContainer}>
                  <input
                    id="includeEasyInput"
                    type="checkbox"
                    checked={includeDiffs!.includes("e")}
                    onChange={this.onInputChange}
                  />
                  <label htmlFor="includeEasyInput">easy</label>
                </div>

                <div className={styles.diffContainer}>
                  <input
                    id="includeNormalInput"
                    type="checkbox"
                    checked={includeDiffs!.includes("n")}
                    onChange={this.onInputChange}
                  />
                  <label htmlFor="includeNormalInput">normal</label>
                </div>

                <div className={styles.diffContainer}>
                  <input
                    id="includeHyperInput"
                    type="checkbox"
                    checked={includeDiffs!.includes("h")}
                    onChange={this.onInputChange}
                  />
                  <label htmlFor="includeHyperInput">hyper</label>
                </div>

                <div className={styles.diffContainer}>
                  <input
                    id="includeExInput"
                    type="checkbox"
                    checked={includeDiffs!.includes("x")}
                    onChange={this.onInputChange}
                  />
                  <label htmlFor="includeExInput">ex</label>
                </div>
              </section>
              <section className={cx(styles.control, styles.hardestDiff)}>
                <input
                  id="onlyIncludeHardestInput"
                  type="checkbox"
                  checked={hardestDiff === "only"}
                  onChange={this.onInputChange}
                />
                <label htmlFor="onlyIncludeHardestInput">
                  Only song&apos;s hardest
                </label>
              </section>
            </>
          )}

          <section className={cx(styles.control, styles.includeFolders)}>
            <label>Folders</label>

            <section className={styles.flex}>
              <input
                id="includeAllFoldersInput"
                type="radio"
                checked={versionFoldersRadio === "all"}
                onChange={this.onInputChange}
              />
              <label htmlFor="includeAllFoldersInput">All</label>
            </section>

            <section className={styles.flex}>
              <input
                id="includeChooseFoldersInput"
                type="radio"
                checked={versionFoldersRadio === "choose"}
                onChange={this.onInputChange}
              />
              <label htmlFor="includeChooseFoldersInput">Choose</label>
            </section>

            {versionFoldersRadio === "choose" && (
              <button
                className={styles.noneFoldersButton}
                type="button"
                onClick={this.onNoneVersionFoldersButtonClick}
              >
                None
              </button>
            )}
          </section>

          {versionFoldersRadio === "choose" && (
            <section className={cx(styles.control, styles.foldersChoose)}>
              {Array.from(Array(VERSION_FOLDERS.length).keys())
                .reverse()
                .map((folderNum) => (
                  <section className={styles.folderSelect} key={folderNum}>
                    <input
                      id={`folder${folderNum}Input`}
                      type="checkbox"
                      checked={versionFolders![folderNum]}
                      onChange={this.onInputChange}
                    />
                    <label htmlFor={`folder${folderNum}Input`}>
                      <FolderPill
                        songFolder={parseVersionFolder(String(folderNum))}
                        style="normal"
                      />
                    </label>
                  </section>
                ))}
            </section>
          )}

          <section className={styles.control}>
            <select
              id="holdNotesSelect"
              className={styles[holdNotes!]}
              value={holdNotes}
              onChange={this.onSelectChange}
            >
              {includeOptions()}
            </select>
            <label htmlFor="holdNotesSelect">Long pop-kuns</label>
          </section>

          <section className={styles.control}>
            <select
              id="buggedBpmsSelect"
              className={styles[buggedBpms!]}
              value={buggedBpms}
              onChange={this.onSelectChange}
            >
              {includeOptions()}
            </select>
            <label htmlFor="excludeBuggedBpmsInput">Bugged bpms</label>
          </section>

          <section className={styles.control}>
            <select
              id="eemallSelect"
              className={styles[eemall!]}
              value={eemall}
              onChange={this.onSelectChange}
            >
              {includeOptions()}
            </select>
            <label htmlFor="eemallSelect">ee&apos;MALL</label>
          </section>

          <section className={styles.control}>
            <select
              id="floorInfectionSelect"
              className={styles[floorInfection!]}
              value={floorInfection}
              onChange={this.onSelectChange}
            >
              {includeOptions()}
            </select>
            <label htmlFor="floorInfectionSelect">FLOOR INFECTION</label>
          </section>

          {gameVersion === "unilab_1218" && (
            <>
              <section className={styles.control}>
                <select
                  id="omnimixSelect"
                  className={styles[omnimix!]}
                  value={omnimix}
                  onChange={this.onSelectChange}
                >
                  {includeOptions()}
                </select>
                <label htmlFor="omnimixSelect">Omnimix</label>
              </section>

              <section className={styles.control}>
                <select
                  id="livelySelect"
                  className={styles[lively!]}
                  value={lively}
                  onChange={this.onSelectChange}
                >
                  {includeOptions()}
                </select>
                <label htmlFor="livelySelect">Lively exclusives</label>
              </section>
            </>
          )}

          <section className={styles.control}>
            <label htmlFor="gameVersionSelect">Game data</label>
            <select
              id="gameVersionSelect"
              className={gameVersion ? styles[gameVersion] : ""}
              value={gameVersion}
              onChange={this.onSelectChange}
            >
              <option value="unilab_1218">UniLab 1218 + extras</option>
              <option value="unilab_0411">UniLab 0411</option>
            </select>
          </section>

          <h5 className={styles.header}>Display options</h5>

          <section className={styles.control}>
            <input
              id="displayGenreInput"
              type="checkbox"
              checked={preferGenre}
              onChange={this.onInputChange}
            />
            <label htmlFor="displayGenreInput">Prefer genre</label>
          </section>

          <section className={styles.control}>
            <label>Chart appearance</label>

            <section className={styles.flex}>
              <input
                id="displayStyleNormalInput"
                type="radio"
                checked={displayStyle === "normal"}
                onChange={this.onInputChange}
              />
              <label htmlFor="displayStyleNormalInput">Normal</label>
            </section>

            <section className={styles.flex}>
              <input
                id="displayStyleCompactInput"
                type="radio"
                checked={displayStyle === "compact"}
                onChange={this.onInputChange}
              />
              <label htmlFor="displayStyleCompactInput">Compact</label>
            </section>
          </section>

          {displayStyle === "compact" && (
            <section className={cx(styles.control, styles.info)}>
              When compact, tap on charts to reveal their{" "}
              {preferGenre ? "genre" : "title"}
            </section>
          )}

          <section className={cx(styles.control, styles.notepad)}>
            <label>
              <section className={styles.left}>
                Notepad
                <span className={styles.info}>Markdown supported</span>
              </section>

              <section className={styles.right}>
                <span className={cx(styles.info, styles.charCount)}>
                  {notepadContents!.length}/1000
                </span>
              </section>
            </label>

            <textarea
              id="notepadTextarea"
              rows={10}
              maxLength={1000}
              value={notepadContents}
              onChange={this.onTextareaChange}
            />
          </section>

          <div className={styles.github}>
            <span className={styles.sha}>{process.env.GIT_SHA}</span>
            <a
              href="https://github.com/fishluv/popn-randomizer"
              target="_blank"
              rel="noreferrer"
            >
              <BsGithub />
            </a>
          </div>
        </ReactModal>
      </section>
    )
  }
}
