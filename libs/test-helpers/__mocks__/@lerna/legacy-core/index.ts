const collectUpdates = require("./collect-updates");

module.exports = {
  ...jest.requireActual("@lerna/legacy-core"),
  ...collectUpdates,
  createSymlink: jest.fn(),
};
