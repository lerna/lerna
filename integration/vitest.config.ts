import { defineConfig } from "vitest/config";
import { defineLernaVitestConfig } from "../vitest.shared";

export default defineConfig(
  defineLernaVitestConfig({
    projectRoot: "integration",
    test: {
      include: ["__tests__/**/*.spec.ts", "__tests__/**/*.test.ts"],
      reporters: ["verbose"],
      setupFiles: ["../libs/test-helpers/src/lib/npm/set-npm-userconfig.ts"],
      snapshotSerializers: ["../libs/test-helpers/src/lib/serializers/serialize-placeholders.ts"],
      // allow CLI integration tests to run for a while (300s)
      testTimeout: 300e3,
    },
  })
);
