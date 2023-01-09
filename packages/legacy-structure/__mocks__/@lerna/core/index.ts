/* eslint-disable @typescript-eslint/no-var-requires */

const collectUpdates = require("./collect-updates");
const { output } = require("./output");

module.exports = {
  ...jest.requireActual("@lerna/core"),
  output,
  ...collectUpdates,
};
