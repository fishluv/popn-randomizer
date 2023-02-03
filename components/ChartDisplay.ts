export type ChartDisplayStyle = "normal" | "compact"

export function parseChartDisplayStyle(s: string): ChartDisplayStyle {
  switch (s) {
    case "normal":
    case "compact":
      return s
    default:
      throw new Error(`Invalid chart display style: [${s}]`)
  }
}

export interface ChartDisplayOptions {
  sranModeEnabled: boolean
  preferGenre: boolean
  showChartDetails: boolean
  displayStyle: ChartDisplayStyle
  assetsUrl: string
  showLinks: boolean
  customLink1Url: string
}
