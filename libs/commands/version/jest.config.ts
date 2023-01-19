/* eslint-disable */
export default {
  displayName: "commands-version",
  preset: "../../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  coverageDirectory: "../../../coverage/libs/commands/version",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testTimeout: 45e3,
};
