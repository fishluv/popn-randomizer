// eslint-disable-next-line @typescript-eslint/no-var-requires
const gitSha = require("child_process")
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim()

/** @type {import('next').NextConfig} */
module.exports = {
  env: {
    GIT_SHA: gitSha,
  },
  reactStrictMode: true,
}
