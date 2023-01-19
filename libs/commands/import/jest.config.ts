/* eslint-disable */
export default {
  displayName: "commands-import",
  preset: "../../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  coverageDirectory: "../../../coverage/libs/commands/import",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
