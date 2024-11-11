import {
  BemaniFolder,
  SranLevel,
  VERSION_FOLDERS,
  VersionFolder,
} from "popn-db-js"

export type IncludeOption = "include" | "exclude" | "only"

export function parseIncludeOption(s: string): IncludeOption {
  const sl = s?.toLowerCase()
  switch (sl) {
    case "only":
      return "only"
    case "exclude":
      return "exclude"
    default:
      return "include"
  }
}

export const ALL_VERSION_FOLDERS: ReadonlyArray<boolean> = VERSION_FOLDERS.map(
  () => true,
)
export const NONE_VERSION_FOLDERS: ReadonlyArray<boolean> = VERSION_FOLDERS.map(
  () => false,
)

export interface ChartDrawOptions {
  count?: number
  level?: string
  levelAdv?: string
  sranLevelMin?: SranLevel
  sranLevelMax?: SranLevel
  sranLevelRange?: boolean
  includeDiffsRadio?: "all" | "choose"
  includeDiffs?: string
  hardestDiff?: IncludeOption
  folder?: VersionFolder | BemaniFolder
  eemall?: IncludeOption
  floorInfection?: IncludeOption
  buggedBpms?: IncludeOption
  holdNotes?: IncludeOption
  omnimix?: IncludeOption
  lively?: IncludeOption
  gameVersion?: string
}
