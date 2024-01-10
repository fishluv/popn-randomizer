import cx from "classnames"
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

const DRAW_COUNT_MIN = 1
const DRAW_COUNT_MAX = 10
const DRAW_COUNTS = range(DRAW_COUNT_MIN, DRAW_COUNT_MAX + 1)

interface ControlPanelOptions {
  isCollapsed: boolean
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
        sranLevelMin,
        sranLevelMax,
        includeDiffsRadio,
        includeDiffs,
        hardestDiff,
        versionFoldersRadio,
        versionFolders,
        floorInfection,
        buggedBpms,
        holdNotes,
        gameVersion,
      },
      initialDisplayOptions: {
        sranModeEnabled,
        preferGenre,
        showChartDetails,
        displayStyle,
        assetsUrl, // Currently not configurable in UI.
        showLinks, // Currently not configurable in UI.
        customLink1Url,
      },
      isCollapsed,
      isMoreControlsOpen,
    } = props

    this.state = {
      // Draw options
      count: count || 4,
      levelMin: levelMin || 30,
      levelMax: levelMax || 40,
      sranLevelMin: sranLevelMin || "01a",
      sranLevelMax: sranLevelMax || "05",
      includeDiffsRadio: includeDiffsRadio ?? "all",
      includeDiffs: includeDiffs ?? "enhx",
      hardestDiff: hardestDiff ?? "include",
      versionFoldersRadio: versionFoldersRadio ?? "all",
      versionFolders: versionFolders ?? ALL_VERSION_FOLDERS.slice(),
      floorInfection: floorInfection ?? "include",
      buggedBpms: buggedBpms ?? "include",
      holdNotes: holdNotes ?? "include",
      gameVersion: gameVersion || "kaimei_0613",
      // Display options
      sranModeEnabled: sranModeEnabled ?? false,
      preferGenre: preferGenre ?? false,
      showChartDetails: showChartDetails ?? false,
      displayStyle: displayStyle ?? "normal",
      assetsUrl: assetsUrl || "https://popn-assets.surge.sh",
      showLinks: showLinks ?? false,
      customLink1Url: customLink1Url || "",
      // Control panel state
      isCollapsed: isCollapsed ?? false,
      isMoreControlsOpen: isMoreControlsOpen ?? false,
    }
  }

  getNewStateForNewLevelMin = (newMin: number) => {
    const { levelMax: prevMax } = this.state

    return {
      levelMin: newMin,
      levelMax: Math.max(prevMax!, newMin),
    }
  }

  getNewStateForNewLevelMax = (newMax: number) => {
    const { levelMin: prevMin } = this.state

    return {
      levelMax: newMax,
      levelMin: Math.min(prevMin!, newMax),
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
      newState = this.getNewStateForNewLevelMin(Number(value))
    } else if (id === "levelUpperSelect") {
      newState = this.getNewStateForNewLevelMax(Number(value))
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
    } else {
      console.warn(`ControlPanel: Unknown id ${id}`)
      return
    }

    this.setState(newState)
    this.props.onChange(newState)
  }

  onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { includeDiffs, versionFolders } = this.state
    const { id, value, checked } = event.target
    let newState

    // TODO: Probably shouldn't assume `type`
    if (id === "displayGenreInput") {
      newState = { preferGenre: checked }
      this.setState(newState) // For type safety, can't put this outside the if block.
    } else if (id === "showChartDetailsInput") {
      newState = { showChartDetails: checked }
      this.setState(newState)
    } else if (id === "isSranModeEnabledInput") {
      newState = { sranModeEnabled: checked }
      this.setState(newState)
    } else if (id === "includeAllDiffsInput" && checked) {
      newState = {
        includeDiffsRadio: "all" as const,
        includeDiffs: "enhx",
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
    } else if (id === "excludeFloorInfectionInput") {
      newState = {
        floorInfection: checked
          ? parseIncludeOption("exclude")
          : parseIncludeOption("include"),
      }
      this.setState(newState)
    } else if (id === "excludeBuggedBpmsInput") {
      newState = {
        buggedBpms: checked
          ? parseIncludeOption("exclude")
          : parseIncludeOption("include"),
      }
      this.setState(newState)
    } else if (id === "customLink1UrlInput") {
      newState = { customLink1Url: value }
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
      sranLevelMin: prevSranMin,
      sranLevelMax: prevSranMax,
    } = this.state

    const { id } = event.currentTarget
    let newState

    if (id === "levelMinDownButton") {
      const newMin = Math.max(1, prevMin! - 1)
      newState = this.getNewStateForNewLevelMin(newMin)
    } else if (id === "levelMinUpButton") {
      const newMin = Math.min(50, prevMin! + 1)
      newState = this.getNewStateForNewLevelMin(newMin)
    } else if (id === "levelMaxDownButton") {
      const newMax = Math.max(1, prevMax! - 1)
      newState = this.getNewStateForNewLevelMax(newMax)
    } else if (id === "levelMaxUpButton") {
      const newMax = Math.min(50, prevMax! + 1)
      newState = this.getNewStateForNewLevelMax(newMax)
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

  onNoneVersionFoldersButtonClick = () => {
    const newState = {
      versionFolders: NONE_VERSION_FOLDERS.slice(),
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
      sranModeEnabled,
      sranLevelMin,
      sranLevelMax,
      includeDiffs,
      hardestDiff,
      versionFolders,
      floorInfection,
      buggedBpms,
      holdNotes,
      gameVersion,
    } = this.state

    const querySegments = []

    if (sranModeEnabled) {
      querySegments.push(`srlv >= ${sranLevelMin}`)
      querySegments.push(`srlv <= ${sranLevelMax}`)
    } else {
      querySegments.push(`lv >= ${levelMin}`)
      querySegments.push(`lv <= ${levelMax}`)
    }

    if (includeDiffs!.split("").sort().join("") !== "ehnx") {
      // TODO: api doesn't support none
      querySegments.push(`diff = ${includeDiffs}`)
    }

    if (buggedBpms === "exclude") {
      querySegments.push("!buggedbpm")
    }

    if (holdNotes === "only") {
      querySegments.push("holds")
    }
    if (holdNotes === "exclude") {
      querySegments.push("!holds")
    }

    if (floorInfection === "exclude") {
      querySegments.push("!floorinfection")
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
    const { levelMin, levelMax, sranModeEnabled, sranLevelMin, sranLevelMax } =
      this.state

    if (sranModeEnabled) {
      return (
        <section className={styles.levelControls}>
          <section className={styles.control}>
            <label htmlFor="sranLevelLowerSelect">Sran level</label>

            <button
              id="sranLevelMinDownButton"
              className={styles.levelDownButton}
              type="button"
              onClick={this.onLevelButtonClick}
            >
              ◀
            </button>
            <select
              id="sranLevelLowerSelect"
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
              ▶
            </button>

            <label htmlFor="sranLevelUpperSelect">to</label>

            <button
              id="sranLevelMaxDownButton"
              className={styles.levelDownButton}
              type="button"
              onClick={this.onLevelButtonClick}
            >
              ◀
            </button>
            <select
              id="sranLevelUpperSelect"
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
              ▶
            </button>
          </section>
        </section>
      )
    }

    return (
      <section>
        <section className={styles.control}>
          <label htmlFor="levelLowerSelect">Level</label>

          <button
            id="levelMinDownButton"
            className={styles.levelDownButton}
            type="button"
            onClick={this.onLevelButtonClick}
          >
            ◀
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
            ▶
          </button>

          <label htmlFor="levelUpperSelect">to</label>

          <button
            id="levelMaxDownButton"
            className={styles.levelDownButton}
            type="button"
            onClick={this.onLevelButtonClick}
          >
            ◀
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
            ▶
          </button>
        </section>
      </section>
    )
  }

  getSummaryString = () => {
    const {
      count,
      levelMin,
      levelMax,
      sranModeEnabled,
      sranLevelMin,
      sranLevelMax,
    } = this.state

    if (sranModeEnabled) {
      if (sranLevelMin === sranLevelMax) {
        return `${count} songs, sran lv ${normSranLevel(sranLevelMin!)}`
      }
      return `${count} songs, sran lv ${normSranLevel(
        sranLevelMin!,
      )}~${normSranLevel(sranLevelMax!)}`
    }

    if (levelMin === levelMax) {
      return `${count} songs, lv ${levelMin}`
    }
    return `${count} songs, lv ${levelMin}~${levelMax}`
  }

  toggleCollapsed = () => {
    this.setState((prevState) => {
      const newValue = !prevState.isCollapsed
      localStorage.setItem("isCollapsed", newValue.toString())
      return {
        isCollapsed: newValue,
      }
    })
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
    if (window.confirm("Reset options to default values?")) {
      const newState: ChartDrawOptions & Partial<ChartDisplayOptions> = {
        // Draw options
        count: 4,
        levelMin: 30,
        levelMax: 40,
        sranLevelMin: "01a",
        sranLevelMax: "05",
        includeDiffsRadio: "all",
        includeDiffs: "enhx",
        hardestDiff: "include",
        versionFoldersRadio: "all",
        versionFolders: ALL_VERSION_FOLDERS.slice(),
        floorInfection: "include",
        buggedBpms: "include",
        holdNotes: "include",
        gameVersion: "kaimei_0613",
        // Display options
        sranModeEnabled: false,
        preferGenre: false,
        displayStyle: "normal",
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
      floorInfection,
      buggedBpms,
      holdNotes,
      sranModeEnabled,
      gameVersion,
      preferGenre,
      displayStyle,
      // customLink1Url,
      isCollapsed,
      isMoreControlsOpen,
    } = this.state

    const rootClassName = cx(extraClass, styles.ControlPanel)

    return (
      <section className={rootClassName}>
        {!isCollapsed && (
          <section className={styles.drawControl}>
            <section className={styles.control}>
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
          </section>
        )}

        <section className={styles.buttonsAndSummary}>
          <button type="button" onClick={this.onDrawClick}>
            Draw
          </button>

          {!isCollapsed && (
            <button type="button" onClick={this.openMoreControls}>
              Advanced
            </button>
          )}

          {isCollapsed && (
            <span className={styles.summary}>{this.getSummaryString()}</span>
          )}

          <button
            className={styles.clearButton}
            type="button"
            onClick={this.onClearClick}
          >
            🗑
          </button>

          <button
            className={styles.collapseButton}
            type="button"
            onClick={this.toggleCollapsed}
          >
            {isCollapsed ? "🔻Expand" : "🔺Collapse"}
          </button>
        </section>

        <ReactModal
          isOpen={isMoreControlsOpen}
          contentLabel="More controls modal"
          onRequestClose={this.closeMoreControls}
          style={{
            overlay: { zIndex: 10 },
            content: { inset: 0, padding: "1rem" },
          }}
        >
          <button
            className={styles.closeMoreControlsButton}
            type="button"
            onClick={this.closeMoreControls}
          >
            Close
          </button>

          <button
            className={styles.resetButton}
            type="button"
            onClick={this.resetControls}
          >
            Reset to defaults
          </button>

          <h5 className={styles.header}>Draw options</h5>

          {this.getLevelControls()}

          <section className={styles.control}>
            <input
              id="isSranModeEnabledInput"
              type="checkbox"
              checked={sranModeEnabled}
              onChange={this.onInputChange}
            />
            <label htmlFor="isSranModeEnabledInput">Enable sran mode</label>
          </section>

          <section className={cx(styles.control, styles.includeDiffs)}>
            <span>Include difficulties</span>

            <input
              id="includeAllDiffsInput"
              type="radio"
              checked={includeDiffsRadio === "all"}
              onChange={this.onInputChange}
            />
            <label htmlFor="includeAllDiffsInput">All</label>

            <input
              id="includeChooseDiffsInput"
              type="radio"
              checked={includeDiffsRadio === "choose"}
              onChange={this.onInputChange}
            />
            <label htmlFor="includeChooseDiffsInput">Choose</label>

            {includeDiffsRadio === "choose" && (
              <section className={styles.inner}>
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
            )}
          </section>

          <section className={styles.control}>
            <input
              id="onlyIncludeHardestInput"
              type="checkbox"
              checked={hardestDiff === "only"}
              onChange={this.onInputChange}
            />
            <label htmlFor="onlyIncludeHardestInput">
              Only include song&apos;s hardest difficulty
            </label>
          </section>

          <section className={cx(styles.control, styles.includeFolders)}>
            <label>Include folders</label>

            <input
              id="includeAllFoldersInput"
              type="radio"
              checked={versionFoldersRadio === "all"}
              onChange={this.onInputChange}
            />
            <label htmlFor="includeAllFoldersInput">All</label>

            <input
              id="includeChooseFoldersInput"
              type="radio"
              checked={versionFoldersRadio === "choose"}
              onChange={this.onInputChange}
            />
            <label htmlFor="includeChooseFoldersInput">Choose</label>

            {versionFoldersRadio === "choose" && (
              <button
                className={styles.noneFoldersButton}
                type="button"
                onClick={this.onNoneVersionFoldersButtonClick}
              >
                None
              </button>
            )}

            {versionFoldersRadio === "choose" && (
              <section className={styles.inner}>
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
          </section>

          <section className={styles.control}>
            <label htmlFor="holdNotesSelect">Long pop-kuns</label>
            <select
              id="holdNotesSelect"
              className={holdNotes ? styles[holdNotes] : ""}
              value={holdNotes}
              onChange={this.onSelectChange}
            >
              <option value="include">Include</option>
              <option value="exclude">Exclude</option>
              <option value="only">Only</option>
            </select>
          </section>

          <section className={styles.control}>
            <input
              id="excludeBuggedBpmsInput"
              type="checkbox"
              checked={buggedBpms === "exclude"}
              onChange={this.onInputChange}
            />
            <label htmlFor="excludeBuggedBpmsInput">Exclude bugged bpms</label>
          </section>

          <section className={styles.control}>
            <input
              id="excludeFloorInfectionInput"
              type="checkbox"
              checked={floorInfection === "exclude"}
              onChange={this.onInputChange}
            />
            <label htmlFor="excludeFloorInfectionInput">
              Exclude FLOOR INFECTION
            </label>
          </section>

          <section className={styles.control}>
            <label htmlFor="gameVersionSelect">Game data</label>
            <select
              id="gameVersionSelect"
              className={gameVersion ? styles[gameVersion.split("_")[0]] : ""}
              value={gameVersion}
              onChange={this.onSelectChange}
            >
              <option value="unilab_0905">UniLab 0905</option>
              <option value="kaimei_0613">Kaimei final</option>
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
            <label htmlFor="displayGenreInput">Display genre</label>
          </section>

          <section className={cx(styles.control, styles.chartAppearance)}>
            <label>Chart appearance</label>

            <input
              id="displayStyleNormalInput"
              type="radio"
              checked={displayStyle === "normal"}
              onChange={this.onInputChange}
            />
            <label htmlFor="displayStyleNormalInput">Normal</label>

            <input
              id="displayStyleCompactInput"
              type="radio"
              checked={displayStyle === "compact"}
              onChange={this.onInputChange}
            />
            <label htmlFor="displayStyleCompactInput">Compact</label>

            {displayStyle === "compact" && (
              <section className={styles.compactInfo}>
                When compact, tap on charts to reveal their{" "}
                {preferGenre ? "genre" : "title"}
              </section>
            )}
          </section>

          {/* <section className={cx(styles.control, styles.customLink)}>
            <label htmlFor="customLink1UrlInput">Custom link</label>
            <input
              id="customLink1UrlInput"
              type="text"
              value={customLink1Url}
              onChange={this.onInputChange}
            />
          </section> */}
        </ReactModal>

        {/* Show when I come up with UI */}
        {/* {!isCollapsed && <About extraClass={styles.aboutIcon} />} */}
      </section>
    )
  }
}
