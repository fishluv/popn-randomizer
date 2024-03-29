import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"
import { Chart, Unilab1218 } from "popn-db-js"

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
      notepadContents: "",
      assetsUrl: "https://popn-assets.pages.dev/assets",
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

const [absoluteEx] = Unilab1218.findCharts("300ex")
export const PreGenre = templateFor(absoluteEx!)

const [tripleCounterEx] = Unilab1218.findCharts("1549ex")
export const PostGenre = templateFor(tripleCounterEx!)

const [zankokuEx] = Unilab1218.findCharts("539ex")
export const KanjiSongwheelTitleAndGenre = templateFor(zankokuEx!)

const [uraBaliEx] = Unilab1218.findCharts("1770ex")
export const Ura = templateFor(uraBaliEx!)

const [cowboyUpperEx] = Unilab1218.findCharts("1746ex")
export const UpperDifferentTitleAndGenre = templateFor(cowboyUpperEx!)

const [nostosUpperEx] = Unilab1218.findCharts("1815ex")
export const UpperSameTitleAndGenre = templateFor(nostosUpperEx!)

const [aprilFoolUpperEx] = Unilab1218.findCharts("1840ex")
export const KonamiForgotUpper = templateFor(aprilFoolUpperEx!)

const [eggMetalEx] = Unilab1218.findCharts("1407ex")
export const ReallyLongTitle = templateFor(eggMetalEx!)
