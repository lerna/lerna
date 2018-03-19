"use strict";

module.exports = {
  clearMocks: true,
  collectCoverageFrom: ["{commands,core,utils}/**/*.js"],
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/commands", "<rootDir>/core", "<rootDir>/utils"],
  setupFiles: ["@lerna-test/silence-logging", "@lerna-test/set-npm-userconfig"],
  testEnvironment: "node",
};
