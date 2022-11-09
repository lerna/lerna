"use strict";

module.exports = {
  // ensure `npm cit` uses clean cache
  cacheDirectory: "./node_modules/.cache/jest",
  clearMocks: true,
  // windows ci is terribly slow, so let's not burden it with coverage
  collectCoverage: process.env.CI && process.env.LERNA_OS_TYPE !== "windows",
  collectCoverageFrom: [
    "{commands,core,utils}/**/*.js",
    "!commands/create/lerna-module-data.js",
    "!**/__helpers__/**",
  ],
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/commands", "<rootDir>/core", "<rootDir>/utils"],
  setupFiles: ["@lerna-test/helpers/silence-logging", "@lerna-test/helpers/npm/set-npm-userconfig"],
  setupFilesAfterEnv: ["@lerna-test/helpers/setup-unit-test-timeout.js"],
  testEnvironment: "node",
  verbose: !!process.env.CI,
};

// split tests into smaller chunks because windows is agonizingly slow
if (process.env.LERNA_CI_TYPE) {
  module.exports.testMatch =
    process.env.LERNA_CI_TYPE === "publish"
      ? [
          // these tests tend to be longer than any others
          "<rootDir>/commands/publish/**/*.test.js",
          "<rootDir>/commands/version/**/*.test.js",
        ]
      : [
          // NOTE: import is NOT TESTED in windows because pain and suffering
          "<rootDir>/commands/!(publish|version|import)/**/*.test.js",
          "<rootDir>/core/**/*.test.js",
          "<rootDir>/utils/**/*.test.js",
        ];
}
