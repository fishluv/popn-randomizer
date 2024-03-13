import cx from "classnames"
import { OtherFolder, VersionFolder } from "popn-db-js"
import React from "react"
import styles from "./FolderPill.module.scss"

export type FolderPillStyle = "normal" | "compact"

interface FolderPillProps {
  extraClass?: string
  songFolder: VersionFolder | OtherFolder | "lively" | null
  style: FolderPillStyle
}

/**
 * Pill indicating a song's folder (e.g. usaneko, cs, etc.)
 */
export default class FolderPill extends React.Component<FolderPillProps> {
  getFolderDisplayName() {
    const { songFolder, style } = this.props

    if (songFolder === null) {
      return "—"
    }

    if (style === "normal") {
      switch (songFolder) {
        case "27":
          return "unilab"
        case "26":
          return "kaimei riddles"
        case "25":
          return "peace"
        case "24":
          return "usaneko"
        case "23":
          return "eclale"
        case "22":
          return "lapistoria"
        case "21":
          return "sunny park"
        case "20":
          return "fantasia"
        case "19":
          return "tune street"
        case "18":
          return "sengoku retsuden"
        case "17":
          return "the movie"
        case "16":
          return "party"
        case "15":
          return "adventure"
        case "14":
          return "fever"
        case "13":
          return "carnival"
        case "12":
          return "iroha"
      }
    } else {
      switch (songFolder) {
        case "bemani":
          return "bem"
        case "gitadora":
          return "gd"
        case "lively":
          return "liv"
        case "27":
          return "ul"
        case "26":
          return "kr"
        case "25":
          return "pe"
        case "24":
          return "usa"
        case "23":
          return "ecl"
        case "22":
          return "lap"
        case "21":
          return "sp"
        case "20":
          return "fan"
        case "19":
          return "ts"
        case "18":
          return "sr"
        case "17":
          return "mov"
        case "16":
          return "par"
        case "15":
          return "adv"
        case "14":
          return "fev"
        case "13":
          return "car"
        case "12":
          return "iro"
      }
    }

    if (/^\d+/.test(songFolder)) {
      return Number(songFolder).toString()
    } else {
      return songFolder
    }
  }

  render() {
    const { extraClass, songFolder, style } = this.props

    let folderClass
    if (songFolder) {
      if (/^\d/.test(songFolder)) {
        folderClass = `ac${songFolder}`
      } else {
        folderClass = songFolder
      }
    } else {
      folderClass = "none"
    }

    const rootClassName = cx(
      extraClass,
      styles.FolderPill,
      styles[folderClass],
      {
        [styles.compact]: style === "compact",
      },
    )

    return <span className={rootClassName}>{this.getFolderDisplayName()}</span>
  }
}
