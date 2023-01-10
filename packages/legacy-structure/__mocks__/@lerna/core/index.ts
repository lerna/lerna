/* eslint-disable @typescript-eslint/no-var-requires */

const collectUpdates = require("./collect-updates");
const { output } = require("./output");

module.exports = {
  ...jest.requireActual("@lerna/core"),
  output,
  ...collectUpdates,
  createSymlink: jest.fn(),
  npmRunScript: jest.fn(),
  npmRunScriptStreaming: jest.fn(),
  promptConfirmation: jest.fn(),
  rimrafDir: jest.fn(),
};
