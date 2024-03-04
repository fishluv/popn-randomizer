import cx from "classnames"
import React from "react"
import { ChartDisplayOptions } from "./ChartDisplay"
import styles from "./ChartCard.module.scss"
import { Chart } from "popn-db-js"
import FolderPill from "./FolderPill"
import { BsStopwatch } from "react-icons/bs"
import { LiaDrumSolid } from "react-icons/lia"
import { LuMountain } from "react-icons/lu"
import { IoMusicalNotesOutline } from "react-icons/io5"

function getSortChar(titleOrGenre: string, sortChar: string) {
  if (titleOrGenre.charAt(0).toLowerCase() !== sortChar.toLowerCase()) {
    return sortChar
  } else {
    return null
  }
}

interface ChartCardProps {
  extraClass?: string
  chartData: Chart
  isVetoed?: boolean
  chartDisplayOptions: ChartDisplayOptions
}

interface ChartCardState {
  isVetoed: boolean
}

/**
 * Chart info
 */
export default class ChartCard extends React.Component<
  ChartCardProps,
  ChartCardState
> {
  constructor(props: ChartCardProps) {
    super(props)
    this.state = {
      isVetoed: props.isVetoed ?? false,
    }
  }

  onClick = () => {
    this.setState((prevState) => ({
      isVetoed: !prevState.isVetoed,
    }))
  }

  renderDiffLevel() {
    const {
      chartData: { difficulty, level },
      chartDisplayOptions: { displayStyle },
    } = this.props

    const className = cx(styles.diffLevel, styles[difficulty], {
      [styles.compact]: displayStyle === "compact",
    })

    return (
      <span className={className}>
        {difficulty}&nbsp;{level}
      </span>
    )
  }

  renderSranLevel() {
    const {
      chartData: { sranLevel },
      chartDisplayOptions: { sranModeEnabled, displayStyle },
    } = this.props

    if (!sranModeEnabled) {
      return null
    }

    const className = cx(styles.sranLevel, {
      [styles.compact]: displayStyle === "compact",
    })
    const srlvNorm = sranLevel
      ? sranLevel.replace("a", "-").replace("b", "+").replace(/^0+/, "")
      : "—"

    return <span className={className}>sr&nbsp;{srlvNorm}</span>
  }

  renderTitleGenre() {
    const {
      chartDisplayOptions: { sranModeEnabled },
    } = this.props

    const sortChar = this.getTitleOrGenreSortChar()

    const className = cx(styles.titleGenre, {
      [styles.withSranLevel]: sranModeEnabled,
    })

    return (
      <span className={className}>
        {sortChar && `(${sortChar}) `}
        {this.getDisplayTitleOrGenre()}
      </span>
    )
  }

  getTitleOrGenreSortChar = () => {
    const {
      chartDisplayOptions: { preferGenre },
      chartData: { genre, genreSortChar, title, titleSortChar },
    } = this.props

    if (preferGenre) {
      return getSortChar(genre, genreSortChar)
    } else {
      return getSortChar(title, titleSortChar)
    }
  }

  getDisplayTitleOrGenre() {
    const {
      chartDisplayOptions: { preferGenre },
      chartData: { title, genre, songLabels },
    } = this.props

    const titleOrGenre = preferGenre ? genre : title

    const isUpper = songLabels.includes("upper")
    const maybeUpperSuffix = isUpper ? " (UPPER)" : ""

    return `${titleOrGenre}${maybeUpperSuffix}`
  }

  getBannerBgImageStyle() {
    const {
      chartDisplayOptions: { assetsUrl },
      chartData: { songId },
    } = this.props

    const urlWithoutSlash = assetsUrl.replace(/\/$/, "")
    const paddedId = `000${songId}`.slice(-4)
    const bannerUrl = `${urlWithoutSlash}/kc_${paddedId}.png`
    return {
      backgroundImage: `url("${bannerUrl}")`,
    }
  }

  getBannerImage = (width: number, height: number) => {
    const {
      chartDisplayOptions: { assetsUrl },
      chartData: { songId, title },
    } = this.props

    const urlWithoutSlash = assetsUrl.replace(/\/$/, "")
    const paddedId = `000${songId}`.slice(-4)
    const bannerUrl = `${urlWithoutSlash}/kc_${paddedId}.png`

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={styles.bannerImage}
        src={bannerUrl}
        alt={`Banner for ${title}`}
        width={width}
        height={height}
      />
    )
  }

  formatDuration = () => {
    const {
      chartData: { duration },
    } = this.props

    if (duration === null) {
      return "?"
    }

    const min = Math.floor(duration / 60)
    const sec = duration % 60
    return `${min}:${String(sec).padStart(2, "0")}`
  }

  formatRating = () => {
    const {
      chartData: { rating },
    } = this.props

    if (rating === null) {
      return "?"
    }
    if (rating === -1) {
      return "-1.0"
    }
    if (rating === 0) {
      return "0.0"
    }
    if (rating === 1) {
      return "+1.0"
    }
    if (rating > 0) {
      return `+${rating}`
    }
    return rating
  }

  renderNormal() {
    const {
      extraClass,
      chartData: { difficulty, bpm, notes, hasHolds, songFolder, songLabels },
    } = this.props

    const { isVetoed } = this.state

    const diffStyle = styles[difficulty]

    const rootClassName = cx(
      extraClass,
      styles.ChartCard,
      styles.normal,
      diffStyle,
      {
        [styles.vetoed]: isVetoed,
      },
    )

    return (
      <div className={rootClassName} onClick={this.onClick}>
        <div className={cx(diffStyle, styles.topInfoContainer)}>
          <span className={cx(styles.topInfo, diffStyle)}>
            {this.renderDiffLevel()}
            {this.renderSranLevel()}
            {this.renderTitleGenre()}
          </span>
        </div>

        <div className={cx(styles.bottomContainer, diffStyle)}>
          <div className={styles.bannerContainer}>
            {this.getBannerImage(290, 72)}
          </div>

          <FolderPill
            extraClass={styles.folderPill}
            songFolder={songLabels.includes("lively") ? "lively" : songFolder}
            style="normal"
          />
        </div>

        <div className={cx(styles.details, diffStyle)}>
          <span className={styles.item}>
            <LiaDrumSolid size="1rem" />
            <span>{bpm || "?"}</span>
          </span>

          <span className={styles.item}>
            <BsStopwatch size="0.875rem" />
            <span>{this.formatDuration()}</span>
          </span>

          <span className={styles.item}>
            <IoMusicalNotesOutline size="0.875rem" />
            <span>{notes || "?"}</span>
            {hasHolds && <span className={styles.holdsPill}>L</span>}
          </span>

          <span className={styles.item}>
            <LuMountain size="0.875rem" />
            <span>{this.formatRating()}</span>
          </span>
        </div>
      </div>
    )
  }

  renderCompact() {
    const {
      extraClass,
      chartData: { difficulty, songFolder, songLabels },
    } = this.props
    const { isVetoed } = this.state

    const diffStyle = styles[difficulty]

    const rootClass = cx(
      extraClass,
      styles.ChartCard,
      styles.compact,
      diffStyle,
    )

    const bannerClass = cx(styles.banner, {
      [styles.vetoed]: isVetoed,
    })

    return (
      <div className={rootClass} onClick={this.onClick}>
        <div className={cx(diffStyle, styles.bannerTitleGenre)}>
          {this.renderTitleGenre()}

          <div className={bannerClass}>{this.getBannerImage(160, 40)}</div>

          <div className={styles.levels}>
            {this.renderDiffLevel()}
            {this.renderSranLevel()}
          </div>

          <FolderPill
            extraClass={styles.folderPill}
            songFolder={songLabels.includes("lively") ? "lively" : songFolder}
            style="compact"
          />
        </div>
      </div>
    )
  }

  render() {
    const {
      chartDisplayOptions: { displayStyle },
    } = this.props

    if (displayStyle === "normal") {
      return this.renderNormal()
    } else {
      return this.renderCompact()
    }
  }
}
