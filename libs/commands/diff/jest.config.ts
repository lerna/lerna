/* eslint-disable */
export default {
  displayName: "commands-diff",
  preset: "../../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  coverageDirectory: "../../../coverage/libs/commands/diff",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
