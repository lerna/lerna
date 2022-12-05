/* eslint-disable */
export default {
  displayName: "e2e-diff",
  preset: "../../jest.preset.js",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  transform: {
    "^.+\\.[tj]s$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../../coverage/e2e/diff",
  maxWorkers: 1,
  testTimeout: 60000,
  setupFiles: ["<rootDir>/src/test-setup.ts"],
};
