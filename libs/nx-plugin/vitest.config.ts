import { defineConfig } from "vitest/config";
import { defineLernaVitestConfig } from "../../vitest.shared";

export default defineConfig(
  defineLernaVitestConfig({
    projectRoot: "libs/nx-plugin",
  })
);
