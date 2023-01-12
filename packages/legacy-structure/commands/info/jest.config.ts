/* eslint-disable */
export default {
  displayName: "lerna",
  preset: "../../../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  transform: {
    "^.+\\.[tj]s$": "ts-jest",
  },
  // Needed to add "json" to avoid issue resolving spdx-license-ids
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  coverageDirectory: "../../../../coverage/packages/legacy-structure/commands/info",
};
