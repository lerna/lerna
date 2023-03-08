// eslint-disable-next-line import/no-extraneous-dependencies, node/no-unpublished-require
const nxPreset = require("@nrwl/jest/preset").default;

module.exports = {
  ...nxPreset,
  clearMocks: true,
  modulePathIgnorePatterns: ["/__fixtures__/"],
  testEnvironment: "node",
  /* TODO: Update to latest Jest snapshotFormat
   * By default Nx has kept the older style of Jest Snapshot formats
   * to prevent breaking of any existing tests with snapshots.
   * It's recommend you update to the latest format.
   * You can do this by removing snapshotFormat property
   * and running tests with --update-snapshot flag.
   * Example: "nx affected --targets=test,run-e2e-tests,integration --update-snapshot"
   * More info: https://jestjs.io/docs/upgrading-to-jest29#snapshot-format
   */
  snapshotFormat: { escapeString: true, printBasicPrototype: true },
};
