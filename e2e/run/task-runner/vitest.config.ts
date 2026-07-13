import { defineConfig } from "vitest/config";
import { defineLernaE2eVitestConfig } from "../../../vitest.shared";

export default defineConfig(
  defineLernaE2eVitestConfig({
    projectRoot: "e2e/run/task-runner",
    test: {
      // The task runner suites retried more aggressively than the other e2e
      // projects under jest (jest.retryTimes(5) vs 3 elsewhere)
      retry: process.env.LERNA_E2E_DEBUG === "true" ? 0 : 5,
    },
  })
);
