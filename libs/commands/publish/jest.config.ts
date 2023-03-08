/* eslint-disable */
export default {
  displayName: "commands-publish",
  preset: "../../../jest.preset.js",
  coverageDirectory: "../../../coverage/libs/commands/publish",
  // Needed to add "json" to avoid issue resolving spdx-license-ids
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testTimeout: 45e3,
};
