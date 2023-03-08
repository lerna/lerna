/* eslint-disable */
export default {
  displayName: "legacy-structure-commands-create",
  preset: "../../../../jest.preset.js",
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
  // Needed to add "json" to avoid issue resolving spdx-license-ids
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  coverageDirectory: "../../../../coverage/packages/legacy-structure/commands/create",
};
