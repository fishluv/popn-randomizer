import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"
import { Chart, Database } from "popn-db-js"
import SetList from "../components/SetList"

export default {
  title: "Components/SetList",
  component: SetList,
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
} as ComponentMeta<typeof SetList>

const Template: ComponentStory<typeof SetList> = (props) => (
  <SetList {...props} />
)
function templateFor(chartDataSets: Chart[][]) {
  const template = Template.bind({})
  template.args = {
    chartDataSets,
  }
  return template
}

const absolute = Database.findCharts("0e", "0n", "0h", "0ex")

export const MoreThanOne = templateFor([
  absolute as Chart[],
  absolute as Chart[],
])
export const One = templateFor([absolute as Chart[]])
export const Empty = templateFor([])
