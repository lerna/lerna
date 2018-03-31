"use strict";

module.exports = {
  clearMocks: true,
  collectCoverageFrom: ["{commands,core,utils}/**/*.js", "!commands/create/lerna-module-data.js"],
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/commands", "<rootDir>/core", "<rootDir>/utils"],
  setupFiles: ["@lerna-test/set-npm-userconfig"],
  testEnvironment: "node",
};
