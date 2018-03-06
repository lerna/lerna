"use strict";

module.exports = {
  clearMocks: true,
  collectCoverageFrom: ["{commands,core,utils}/**/*.js"],
  modulePathIgnorePatterns: ["<rootDir>/.*/__fixtures__"],
  roots: ["<rootDir>/commands", "<rootDir>/core", "<rootDir>/utils"],
  setupFiles: ["@lerna-test/silence-logging"],
  testEnvironment: "node",
};
