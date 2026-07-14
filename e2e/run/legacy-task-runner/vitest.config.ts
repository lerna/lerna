import { defineConfig } from "vitest/config";
import { defineLernaE2eVitestConfig } from "../../../vitest.shared";

export default defineConfig(
  defineLernaE2eVitestConfig({
    projectRoot: "e2e/run/legacy-task-runner",
  })
);
