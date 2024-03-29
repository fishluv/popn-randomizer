import { IncludeOption, SranLevel, VERSION_FOLDERS } from "popn-db-js"

export const ALL_VERSION_FOLDERS: ReadonlyArray<boolean> = VERSION_FOLDERS.map(
  () => true,
)
export const NONE_VERSION_FOLDERS: ReadonlyArray<boolean> = VERSION_FOLDERS.map(
  () => false,
)

export function serializeVersionFolders(bs: ReadonlyArray<boolean>) {
  return bs.map((b) => (b ? "1" : "0")).join("")
}

export function deserializeVersionFolders(s: string) {
  return s
    .split("")
    .slice(0, VERSION_FOLDERS.length)
    .map((c) => c === "1")
}

export function versionFoldersToQueryValue(bs: ReadonlyArray<boolean>) {
  return bs
    .map((b, i) => {
      if (i === 0) {
        return b ? "cs" : ""
      } else {
        return b ? String(i).padStart(2, "0") : ""
      }
    })
    .join("")
}

export interface ChartDrawOptions {
  count?: number
  levelMin?: number
  levelMax?: number
  levelEmhEnabled?: boolean
  levelMinEmh?: "e" | "m" | "h"
  levelMaxEmh?: "e" | "m" | "h"
  levelRange?: boolean
  sranLevelMin?: SranLevel
  sranLevelMax?: SranLevel
  sranLevelRange?: boolean
  includeDiffsRadio?: "all" | "choose"
  includeDiffs?: string
  hardestDiff?: IncludeOption
  versionFoldersRadio?: "all" | "choose"
  versionFolders?: boolean[]
  eemall?: IncludeOption
  floorInfection?: IncludeOption
  buggedBpms?: IncludeOption
  holdNotes?: IncludeOption
  omnimix?: IncludeOption
  lively?: IncludeOption
  gameVersion?: string
}
