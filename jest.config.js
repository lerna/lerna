"use strict";

module.exports = {
  clearMocks: true,
  collectCoverageFrom: ["{commands,core,utils}/**/*.js", "!commands/create/lerna-module-data.js"],
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/commands", "<rootDir>/core", "<rootDir>/utils"],
  setupFiles: ["@lerna-test/silence-logging", "@lerna-test/set-npm-userconfig"],
  setupTestFrameworkScriptFile: "<rootDir>/setup-unit-test-timeout.js",
  testEnvironment: "node",
  testRunner: "jest-circus/runner",
};
