"use strict";

module.exports = {
  clearMocks: true,
  // windows ci is terribly slow, so let's not burden it with coverage
  collectCoverage: process.env.CI && process.env.TRAVIS_OS_NAME !== "windows",
  collectCoverageFrom: ["{commands,core,utils}/**/*.js", "!commands/create/lerna-module-data.js"],
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/commands", "<rootDir>/core", "<rootDir>/utils"],
  setupFiles: ["@lerna-test/silence-logging", "@lerna-test/set-npm-userconfig"],
  setupFilesAfterEnv: ["<rootDir>/setup-unit-test-timeout.js"],
  testEnvironment: "node",
  testRunner: "jest-circus/runner",
  verbose: !!process.env.CI,
};
