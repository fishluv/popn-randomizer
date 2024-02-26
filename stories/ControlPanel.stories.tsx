import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import ControlPanel from "../components/ControlPanel"

export default {
  title: "Components/ControlPanel",
  component: ControlPanel,
  args: {
    // TODO It would be nice to control these more easily...
    initialDrawOptions: {
      gameVersion: "",
      count: 0,
    },
    initialDisplayOptions: {
      assetsUrl: "",
    },
  },
} as ComponentMeta<typeof ControlPanel>

const Template: ComponentStory<typeof ControlPanel> = (props) => (
  <ControlPanel {...props} />
)

export const Default = Template.bind({})

export const MoreControlsOpen = Template.bind({})
MoreControlsOpen.args = { isMoreControlsOpen: true }
