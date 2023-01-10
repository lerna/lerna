/* eslint-disable @typescript-eslint/no-var-requires */

const collectUpdates = require("./collect-updates");
const { output } = require("./output");
const { hasNpmVersion } = require("./has-npm-version");
const { runLifecycle, createRunner } = require("./run-lifecycle");

module.exports = {
  ...jest.requireActual("@lerna/core"),
  output,
  ...collectUpdates,
  hasNpmVersion,
  runLifecycle,
  createRunner,
  createSymlink: jest.fn(),
  npmRunScript: jest.fn(),
  npmRunScriptStreaming: jest.fn(),
  promptConfirmation: jest.fn(),
  rimrafDir: jest.fn(),
  npmInstall: jest.fn(),
  npmInstallDependencies: jest.fn(),
};
