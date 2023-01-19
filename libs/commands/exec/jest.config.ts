/* eslint-disable */
export default {
  displayName: "commands-exec",
  preset: "../../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  coverageDirectory: "../../../coverage/libs/commands/exec",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
