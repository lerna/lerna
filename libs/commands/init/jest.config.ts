/* eslint-disable */
export default {
  displayName: "commands-init",
  preset: "../../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  coverageDirectory: "../../../coverage/libs/commands/init",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
