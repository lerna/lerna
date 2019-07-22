"use strict";

module.exports = {
  // ensure `npm cit` uses clean cache
  cacheDirectory: "./node_modules/.cache/jest",
  clearMocks: true,
  // windows ci is terribly slow, so let's not burden it with coverage
  collectCoverage: process.env.CI && process.env.TRAVIS_OS_NAME !== "windows",
  collectCoverageFrom: [
    "{commands,core,utils}/**/*.js",
    "!commands/create/lerna-module-data.js",
    "!**/__helpers__/**",
  ],
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/commands", "<rootDir>/core", "<rootDir>/utils"],
  setupFiles: ["@lerna-test/silence-logging", "@lerna-test/set-npm-userconfig"],
  setupFilesAfterEnv: ["<rootDir>/setup-unit-test-timeout.js"],
  testEnvironment: "node",
  testRunner: "jest-circus/runner",
  verbose: !!process.env.CI,
};

// split tests into smaller chunks because windows is agonizingly slow
if (process.env.CI && process.env.TRAVIS_OS_NAME === "windows") {
  module.exports.testMatch =
    process.env.LERNA_CI_TYPE === "publish"
      ? [
          // these tests tend to be longer than any others
          "<rootDir>/commands/publish/**/*.test.js",
          "<rootDir>/commands/version/**/*.test.js",
        ]
      : [
          "<rootDir>/commands/!(publish|version)/**/*.test.js",
          "<rootDir>/core/**/*.test.js",
          "<rootDir>/utils/**/*.test.js",
        ];
}
