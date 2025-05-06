// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/configuration

/** @type {import('jest').Config} */
const config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Files to be included in coverage collection
  collectCoverageFrom: ["scripts/**/*.mjs", "!scripts/__tests__/**/*"],

  // Use this configuration option to add custom reporters to Jest
  // reporters: undefined,

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  testMatch: ["**/__tests__/**/*.test.mjs"],

  // A map from regular expressions to paths to transformers
  transform: {},

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: ["/node_modules/", "\\.pnp\\.[^\\/]+$"],

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // To support ESM modules
  testTimeout: 30000,

  // Setup files to run before each test
  setupFilesAfterEnv: ["./scripts/__tests__/jest.setup.mjs"],
};

module.exports = config;
