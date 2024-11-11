import cx from "classnames"
import markdownit from "markdown-it"
import React from "react"
import ReactModal from "react-modal"
import {
  parseSranLevel,
  SranLevel,
  SRAN_LEVELS,
  VersionFolder,
  BemaniFolder,
} from "popn-db-js"
import styles from "./ControlPanel.module.scss"
import { ChartDisplayOptions } from "./ChartDisplay"
import { ChartQuerySampleOptions } from "../pages/RandomizerApp"
import { ChartDrawOptions, parseIncludeOption } from "./ChartDrawOptions"
import { BsGithub } from "react-icons/bs"
import { FaTrash } from "react-icons/fa"
import { RiSettings3Fill } from "react-icons/ri"
import { VscTriangleLeft, VscTriangleRight } from "react-icons/vsc"

const md = markdownit({ html: false, breaks: true, linkify: true })
ReactModal.setAppElement("#app")

const FOLDER_OPTIONS: {
  id: VersionFolder | BemaniFolder | "dummy1" | "dummy2"
  label?: string
  disabled?: boolean
}[] = [
  { id: "dummy1", label: "-- Version folders --", disabled: true },
  { id: "28", label: "jam&fizz" },
  { id: "27", label: "unilab" },
  { id: "26", label: "kaimei riddles" },
  { id: "25", label: "peace" },
  { id: "24", label: "usaneko" },
  { id: "23", label: "eclale" },
  { id: "22", label: "lapistoria" },
  { id: "21", label: "sunny park" },
  { id: "20", label: "fantasia" },
  { id: "19", label: "tune street" },
  { id: "18", label: "sengoku retsuden" },
  { id: "17", label: "the movie" },
  { id: "16", label: "party" },
  { id: "15", label: "adventure" },
  { id: "14", label: "fever" },
  { id: "13", label: "carnival" },
  { id: "12", label: "iroha" },
  { id: "11" },
  { id: "10" },
  { id: "9" },
  { id: "8" },
  { id: "7" },
  { id: "6" },
  { id: "5" },
  { id: "4" },
  { id: "3" },
  { id: "2" },
  { id: "1" },
  { id: "cs" },
  { id: "dummy2", label: "-- Bemani folders --", disabled: true },
  { id: "iidx" },
  { id: "ddr" },
  { id: "gitadora" },
  { id: "jubeat" },
  { id: "reflec" },
  { id: "sdvx" },
  { id: "beatstream" },
  { id: "museca" },
  { id: "nostalgia" },
  { id: "bemani" },
]

function Select({
  className,
  id,
  label,
  options,
  dummyOption,
  selectedOption,
  setOption,
  disabled,
}: {
  className?: string
  id: string
  label: string
  options: { id: string; label?: string; disabled?: boolean }[]
  dummyOption?: string
  selectedOption: string
  setOption(id: string): void
  disabled?: boolean
}) {
  return (
    <div className={className}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={selectedOption}
        onChange={(event) => setOption(event.target.value)}
        disabled={disabled}
      >
        {dummyOption && <option value="">{dummyOption}</option>}
        {options.map(({ id, label, disabled }) => {
          return (
            <option key={id} value={id} disabled={disabled}>
              {label || id}
            </option>
          )
        })}
      </select>
    </div>
  )
}

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

// TODO: bring back emh
function isLevelAdvValid(levelAdv: string) {
  const tokens = levelAdv
    .trim()
    .split(/\b/)
    .map((s) => s.trim())

  function numInRange(s: string) {
    const num = Number(s)
    return num >= 1 && num <= 50
  }

  if (tokens.length === 1) {
    return numInRange(tokens[0])
  }

  if (tokens.length === 2) {
    if (tokens[0] === "-") {
      return numInRange(tokens[1])
    } else if (tokens[1] === "-") {
      return numInRange(tokens[0])
    } else {
      return false
    }
  }

  if (tokens.length === 3) {
    return (
      numInRange(tokens[0]) &&
      tokens[1] === "-" &&
      numInRange(tokens[2]) &&
      Number(tokens[2]) >= Number(tokens[0])
    )
  }

  return false
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
        level,
        levelAdv,
        sranLevelMin,
        sranLevelMax,
        sranLevelRange,
        includeDiffsRadio,
        includeDiffs,
        hardestDiff,
        folder,
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
      level, // undefined is fine
      levelAdv, // undefined is fine
      sranLevelMin: sranLevelMin || "01a",
      sranLevelMax: sranLevelMax || "05",
      sranLevelRange: sranLevelRange ?? false,
      includeDiffsRadio: includeDiffsRadio ?? "all",
      includeDiffs: includeDiffs ?? "enhx",
      hardestDiff: hardestDiff ?? "include",
      folder, // undefined is fine
      eemall: eemall ?? "include",
      floorInfection: floorInfection ?? "include",
      buggedBpms: buggedBpms ?? "include",
      holdNotes: holdNotes ?? "include",
      omnimix: omnimix ?? "exclude",
      lively: lively ?? "exclude",
      gameVersion: gameVersion || "unilab_0731",
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
        holdNotes: parseIncludeOption(value),
      }
    } else if (id === "buggedBpmsSelect") {
      newState = {
        buggedBpms: parseIncludeOption(value),
      }
    } else if (id === "eemallSelect") {
      newState = {
        eemall: parseIncludeOption(value),
      }
    } else if (id === "floorInfectionSelect") {
      newState = {
        floorInfection: parseIncludeOption(value),
      }
    } else if (id === "omnimixSelect") {
      newState = {
        omnimix: parseIncludeOption(value),
      }
    } else if (id === "livelySelect") {
      newState = {
        lively: parseIncludeOption(value),
      }
    } else {
      console.warn(`ControlPanel: Unknown id ${id}`)
      return
    }

    this.setState(newState)
    this.props.onChange(newState)
  }

  onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { includeDiffs } = this.state
    const { id, checked } = event.target
    let newState

    // TODO: Probably shouldn't assume `type`
    if (id === "displayGenreInput") {
      newState = { preferGenre: checked }
      this.setState(newState) // For type safety, can't put this outside the if block.
    } else if (id === "showChartDetailsInput") {
      newState = { showChartDetails: checked }
      this.setState(newState)
    } else if (id === "sranLevelRangeInput") {
      newState = { sranLevelRange: checked }
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

  onDrawCountButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const { count: prevCount } = this.state
    let newState

    switch (event.currentTarget.id) {
      case "drawCountDownButton":
        newState = { count: Math.max(1, prevCount! - 1) }
        break
      case "drawCountUpButton":
        newState = { count: Math.min(10, prevCount! + 1) }
        break
      default:
        console.warn(
          `onDrawCountButtonClick unknown id ${event.currentTarget.id}`,
        )
        return
    }

    this.setState(newState)
    this.props.onChange(newState)
  }

  onLevelButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const { sranLevelMin: prevSranMin, sranLevelMax: prevSranMax } = this.state

    const { id } = event.currentTarget
    let newState

    if (id === "sranLevelMinDownButton") {
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
      console.warn(`onLevelButtonClick unknown id ${id}`)
      return
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
      level,
      levelAdv,
      sranModeEnabled,
      sranLevelMin,
      sranLevelMax,
      sranLevelRange,
      includeDiffs,
      hardestDiff,
      folder,
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
      if (sranLevelRange) {
        querySegments.push(`srlv >= ${sranLevelMin}`)
        querySegments.push(`srlv <= ${sranLevelMax}`)
      } else {
        querySegments.push(`srlv = ${sranLevelMin}`)
      }
    } else if (levelAdv && isLevelAdvValid(levelAdv)) {
      if (levelAdv.includes("-")) {
        const [min, max] = levelAdv.split("-").map((s) => s.trim())
        querySegments.push(`lv >= ${min || 1}`)
        querySegments.push(`lv <= ${max || 50}`)
      } else {
        querySegments.push(`lv = ${levelAdv}`)
      }
    } else if (level) {
      querySegments.push(`lv = ${level}`)
    } else {
      // TODO: this shouldn't be necessary
      querySegments.push("lv >= 1")
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

    if (gameVersion === "jamfizz_0925") {
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

    if (folder) {
      querySegments.push(`folder = ${folder}`)
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
      level,
      levelAdv,
      sranModeEnabled,
      sranLevelMin,
      sranLevelMax,
      sranLevelRange,
    } = this.state

    if (sranModeEnabled) {
      return (
        <section className={cx(styles.control, styles.level)}>
          <label htmlFor="sranLevelLowerSelect">Sran</label>

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

          {sranLevelRange && (
            <>
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
                  className={
                    styles[`sranlevel${sranLevelCategory(sranLevelMax)}`]
                  }
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
            </>
          )}

          <input
            id="sranLevelRangeInput"
            type="checkbox"
            checked={sranLevelRange}
            onChange={this.onInputChange}
          />
          <label htmlFor="sranLevelRangeInput">Range</label>
        </section>
      )
    }

    return (
      <>
        <div className={cx(styles.control, styles.level)}>
          <Select
            className={styles.control}
            id="levelSelect"
            label="Level"
            options={Array(50)
              .fill(0)
              .map((_, i) => {
                const lv = String(50 - i)
                return {
                  id: lv,
                  label: lv,
                }
              })}
            dummyOption="(any)"
            selectedOption={level || ""}
            setOption={(id) => {
              const newState = { level: id }
              this.setState(newState)
              this.props.onChange(newState)
            }}
            disabled={!!levelAdv && isLevelAdvValid(levelAdv)}
          />
          {" or "}
          <input
            className={
              levelAdv
                ? isLevelAdvValid(levelAdv)
                  ? styles.levelAdvValid
                  : styles.levelAdvInvalid
                : ""
            }
            id="levelInput"
            type="text"
            value={levelAdv || ""}
            onChange={(event) => {
              const newState = { levelAdv: event.target.value }
              this.setState(newState)
              this.props.onChange(newState)
            }}
          />
        </div>
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
      level,
      levelAdv,
      sranModeEnabled,
      sranLevelMin,
      sranLevelMax,
      sranLevelRange,
    } = this.state

    if (sranModeEnabled) {
      if (!sranLevelRange || sranLevelMin === sranLevelMax) {
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

    if (levelAdv && isLevelAdvValid(levelAdv)) {
      if (levelAdv.includes("-")) {
        let [min, max] = levelAdv.split("-").map((s) => s.trim())
        min ||= "1"
        max ||= "50"
        if (min === max) {
          return (
            <>
              {count}
              {" songs, "}
              {min}
            </>
          )
        } else {
          return (
            <>
              {count}
              {" songs, "}
              {min}
              {"-"}
              {max}
            </>
          )
        }
      } else {
        return (
          <>
            {count}
            {" songs, "}
            {levelAdv}
          </>
        )
      }
    } else {
      return (
        <>
          {count}
          {" songs, "}
          {level || "any level"}
        </>
      )
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
        level: undefined,
        levelAdv: undefined,
        sranLevelMin: "01a",
        sranLevelMax: "05",
        sranLevelRange: false,
        includeDiffsRadio: "all",
        includeDiffs: "enhx",
        hardestDiff: "include",
        folder: undefined,
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
      folder,
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
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
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

            <section className={styles.flex}>
              <button
                id="drawCountDownButton"
                type="button"
                onClick={this.onDrawCountButtonClick}
              >
                <VscTriangleLeft />
              </button>
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
              <button
                id="drawCountUpButton"
                type="button"
                onClick={this.onDrawCountButtonClick}
              >
                <VscTriangleRight />
              </button>
            </section>
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

          <Select
            className={cx(styles.control)}
            id="folderSelect"
            label="Folder"
            options={FOLDER_OPTIONS}
            dummyOption="(any)"
            selectedOption={folder || ""}
            setOption={(id: VersionFolder | BemaniFolder) => {
              const newState = { folder: id }
              this.setState(newState)
              this.props.onChange(newState)
            }}
          />

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

          {gameVersion === "jamfizz_0925" && (
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
              <option value="jamfizz_0925">Jam&Fizz 0925 + extras</option>
              <option value="unilab_0731">UniLab 0731</option>
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
