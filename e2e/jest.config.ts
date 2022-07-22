export default {
  transform: {
    "^.+\\.[tj]sx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "html"],
  maxWorkers: "50%",
  globals: { "ts-jest": { tsconfig: "<rootDir>/tsconfig.spec.json" } },
  displayName: "e2e",
  testTimeout: 60000,
  setupFiles: ["<rootDir>/utils/setup.ts"],
};
