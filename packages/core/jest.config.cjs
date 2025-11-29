module.exports = {
  automock: false,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["json", "text", "lcov"],
  modulePathIgnorePatterns: ["./jest.config.cjs", "./out/"],
  setupFilesAfterEnv: ["<rootDir>/jest.env-setup.js"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc-node/jest",
      {
        module: "commonjs",
        swc: {
          jsc: {
            target: "es2020",
            parser: {
              syntax: "typescript",
              tsx: false,
            },
          },
          sourceMaps: "inline",
          minify: false,
        },
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/", "\\.pnp\\.[^\\/]+$"],
};
