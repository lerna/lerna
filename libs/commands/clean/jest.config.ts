/* eslint-disable */
export default {
  displayName: "commands-clean",
  preset: "../../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  coverageDirectory: "../../../coverage/libs/commands/clean",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
