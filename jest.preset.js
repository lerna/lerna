/* eslint-disable */
const nxPreset = require("@nx/jest/preset").default;
const { workspaceRoot } = require("@nx/devkit");
const { join } = require("node:path");
/* eslint-enable */

// ESM-only packages used by conventional-changelog ecosystem.
// These packages only export "import" condition, no "require"/"default",
// so Jest's CJS resolver cannot find them. Map to their dist entry points directly.
const esmPackageMap = {
  "^conventional-changelog$": "node_modules/conventional-changelog/dist/index.js",
  "^conventional-recommended-bump$": "node_modules/conventional-recommended-bump/dist/index.js",
  "^@conventional-changelog/git-client$": "node_modules/@conventional-changelog/git-client/dist/index.js",
  "^conventional-changelog-writer$": "node_modules/conventional-changelog-writer/dist/index.js",
  "^conventional-commits-parser$": "node_modules/conventional-commits-parser/dist/index.js",
  "^conventional-commits-filter$": "node_modules/conventional-commits-filter/dist/index.js",
  "^conventional-changelog-preset-loader$": "node_modules/conventional-changelog-preset-loader/dist/index.js",
  "^conventional-changelog-angular$": "node_modules/conventional-changelog-angular/src/index.js",
  "^@simple-libs/hosted-git-info$": "node_modules/@simple-libs/hosted-git-info/dist/index.js",
  "^@simple-libs/stream-utils$": "node_modules/@simple-libs/stream-utils/dist/index.js",
  "^@simple-libs/child-process-utils$": "node_modules/@simple-libs/child-process-utils/dist/index.js",
  "^fd-package-json$": "node_modules/fd-package-json/lib/main.js",
};

// Convert to absolute paths
const moduleNameMapper = {};
for (const [pattern, relativePath] of Object.entries(esmPackageMap)) {
  moduleNameMapper[pattern] = join(workspaceRoot, relativePath);
}

module.exports = {
  ...nxPreset,
  clearMocks: true,
  modulePathIgnorePatterns: ["/__fixtures__/", "<rootDir>/dist/"],
  testEnvironment: "node",
  moduleNameMapper,
  // Allow Jest to transform ESM-only packages in node_modules
  transformIgnorePatterns: [
    "node_modules/(?!(conventional-changelog|conventional-recommended-bump|@conventional-changelog|conventional-changelog-preset-loader|conventional-changelog-writer|conventional-commits-parser|conventional-commits-filter|conventional-changelog-angular|@simple-libs|fd-package-json)/)",
  ],
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
  globalSetup: join(workspaceRoot, "jest-global-setup.js"),
};
