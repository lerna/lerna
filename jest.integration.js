"use strict";

module.exports = {
  bail: true,
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/integration"],
  setupTestFrameworkScriptFile: "<rootDir>/setup-integration-timeout.js",
  snapshotSerializers: ["@lerna-test/serialize-placeholders"],
  testEnvironment: "node",
  verbose: true,
};
