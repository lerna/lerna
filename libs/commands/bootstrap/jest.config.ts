/* eslint-disable */
export default {
  displayName: "commands-bootstrap",
  preset: "../../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  coverageDirectory: "../../../coverage/libs/commands/bootstrap",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
