/* eslint-disable */
export default {
  displayName: "commands-run",
  preset: "../../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  coverageDirectory: "../../../coverage/libs/commands/run",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
