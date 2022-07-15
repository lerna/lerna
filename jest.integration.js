"use strict";

module.exports = {
  modulePathIgnorePatterns: ["/__fixtures__/"],
  roots: ["<rootDir>/integration"],
  setupFiles: ["@lerna-test/helpers/npm/set-npm-userconfig"],
  setupFilesAfterEnv: ["@lerna-test/helpers/setup-integration-timeout.js"],
  snapshotSerializers: ["@lerna-test/helpers/serializers/serialize-placeholders"],
  testEnvironment: "node",
  verbose: true,
};

// split tests into smaller chunks because windows is agonizingly slow
if (process.env.LERNA_CI_TYPE) {
  module.exports.testMatch =
    process.env.LERNA_CI_TYPE === "publish"
      ? ["<rootDir>/integration/@(lerna-publish)*.test.js"]
      : ["<rootDir>/integration/!(lerna-publish|lerna-import)*.test.js"];
}
