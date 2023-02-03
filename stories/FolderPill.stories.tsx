import React from "react"
import { ComponentMeta } from "@storybook/react"

import FolderPill from "../components/FolderPill"
import { VERSION_FOLDERS } from "popn-db-js"

export default {
  title: "Components/FolderPill",
} as ComponentMeta<typeof FolderPill>

export const Default = () => (
  <div>
    {VERSION_FOLDERS.map((folder) => (
      <>
        <FolderPill songFolder={folder} style="normal" />
        <br />
      </>
    ))}

    <br />

    {VERSION_FOLDERS.map((folder) => (
      <>
        <FolderPill songFolder={folder} style="compact" />
        <br />
      </>
    ))}
  </div>
)
