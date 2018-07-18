"use strict";

module.exports = {
  bail: true,
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/integration"],
  setupFiles: ["@lerna-test/set-npm-userconfig"],
  setupTestFrameworkScriptFile: "<rootDir>/setup-integration-timeout.js",
  snapshotSerializers: ["@lerna-test/serialize-placeholders"],
  testEnvironment: "node",
  testRunner: "jest-circus/runner",
  verbose: true,
};
