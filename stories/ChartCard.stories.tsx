import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"
import { Chart, Database } from "popn-db-js"

import ChartCard from "../components/ChartCard"

export default {
  title: "Components/ChartCard",
  component: ChartCard,
  args: {
    isVetoed: false,
    chartDisplayOptions: {
      sranModeEnabled: false,
      preferGenre: false,
      showChartDetails: false,
      displayStyle: "normal",
      assetsUrl: "https://popn-assets.surge.sh",
      showLinks: false,
      customLink1Url: "",
    },
  },
  argTypes: {
    isVetoed: { control: "boolean" },
  },
} as ComponentMeta<typeof ChartCard>

const Template: ComponentStory<typeof ChartCard> = (props) => (
  <ChartCard {...props} />
)
function templateFor(chart: Chart) {
  const template = Template.bind({})
  template.args = {
    chartData: chart,
  }
  return template
}

const [absoluteEx] = Database.findCharts("300ex")
export const PreGenre = templateFor(absoluteEx!)

const [tripleCounterEx] = Database.findCharts("1549ex")
export const PostGenre = templateFor(tripleCounterEx!)

const [zankokuEx] = Database.findCharts("539ex")
export const KanjiSongwheelTitleAndGenre = templateFor(zankokuEx!)

const [uraBaliEx] = Database.findCharts("1770ex")
export const Ura = templateFor(uraBaliEx!)

const [cowboyUpperEx] = Database.findCharts("1746ex")
export const UpperDifferentTitleAndGenre = templateFor(cowboyUpperEx!)

const [nostosUpperEx] = Database.findCharts("1815ex")
export const UpperSameTitleAndGenre = templateFor(nostosUpperEx!)

const [aprilFoolUpperEx] = Database.findCharts("1840ex")
export const KonamiForgotUpper = templateFor(aprilFoolUpperEx!)

const [eggMetalEx] = Database.findCharts("1407ex")
export const ReallyLongTitle = templateFor(eggMetalEx!)
