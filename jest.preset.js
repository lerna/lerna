// eslint-disable-next-line import/no-extraneous-dependencies, node/no-unpublished-require
const nxPreset = require("@nrwl/jest/preset").default;

module.exports = {
  ...nxPreset,
  clearMocks: true,
  modulePathIgnorePatterns: ["/__fixtures__/"],
};
