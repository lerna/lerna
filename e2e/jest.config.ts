export default {
  transform: {
    "^.+\\.[tj]sx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "html"],
  maxWorkers: 1,
  globals: { "ts-jest": { tsconfig: "<rootDir>/tsconfig.spec.json" } },
  displayName: "e2e",
  testTimeout: 30000,
};
