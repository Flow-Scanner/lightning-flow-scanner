// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  _comment:
    "This config was generated using 'stryker init'. Please take a look at: https://stryker-mutator.io/docs/stryker-js/configuration/ for more information.",
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  commandRunner: { command: "npm test" },
  testRunner: "jest",
  jest: {
    config: {
      testEnvironment: "node",
    },
    enableFindRelatedTests: true,
  },
  testRunnerNodeArgs: ["--experimental-vm-modules"],
  testRunner_comment:
    "Take a look at https://stryker-mutator.io/docs/stryker-js/jest-runner for information about the jest plugin.",
  coverageAnalysis: "perTest",
  mutate: ["src/**/*.ts", "!tests/**/*.test.ts"],
  ignoreStatic: true,
};
export default config;
