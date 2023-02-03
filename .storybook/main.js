const path = require("path")

module.exports = {
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  framework: "@storybook/react",
  // https://storybook.js.org/docs/react/configure/webpack#extending-storybooks-webpack-config
  // https://dev.to/trinwin/2020-complete-setup-for-storybook-nextjs-typescript-scss-and-jest-4khm
  webpackFinal: async (config, { configType }) => {
    config.module.rules.push({
      test: /\.scss$/,
      use: ["style-loader", "css-loader", "sass-loader"],
      include: path.resolve(__dirname, "../"),
    })

    return config
  },
}
