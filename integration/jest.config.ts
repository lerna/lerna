/* eslint-disable */
export default {
  displayName: "integration",
  preset: "../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]sx?$": "ts-jest",
  },
  // Needed to add "json" to avoid issue resolving spdx-license-ids
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  coverageDirectory: "../coverage/integration",
  setupFiles: ["../libs/test-helpers/src/lib/npm/set-npm-userconfig.js"],
  snapshotSerializers: ["../libs/test-helpers/src/lib/serializers/serialize-placeholders"],
  verbose: true,
  // allow CLI integration tests to run for awhile (300s)
  testTimeout: 300e3,
};

// split tests into smaller chunks because windows is agonizingly slow
if (process.env.LERNA_CI_TYPE) {
  module.exports.testMatch =
    process.env.LERNA_CI_TYPE === "publish"
      ? ["<rootDir>/@(lerna-publish)*.test.js"]
      : ["<rootDir>/!(lerna-publish|lerna-import)*.test.js"];
}
