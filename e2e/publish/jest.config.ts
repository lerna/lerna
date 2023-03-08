/* eslint-disable */
export default {
  displayName: "e2e-publish",
  preset: "../../jest.preset.js",
  transform: {
    "^.+\\.[tj]s$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../../coverage/e2e/publish",
  maxWorkers: 1,
  testTimeout: 60000,
  setupFiles: ["<rootDir>/src/test-setup.ts"],
};
