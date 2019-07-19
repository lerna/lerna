"use strict";

module.exports = {
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/integration"],
  setupFiles: ["@lerna-test/set-npm-userconfig"],
  setupFilesAfterEnv: ["<rootDir>/setup-integration-timeout.js"],
  snapshotSerializers: ["@lerna-test/serialize-placeholders"],
  testEnvironment: "node",
  testRunner: "jest-circus/runner",
  verbose: true,
};
