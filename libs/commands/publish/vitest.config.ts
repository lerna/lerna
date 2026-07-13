import { defineConfig } from "vitest/config";
import { defineLernaVitestConfig } from "../../../vitest.shared";

export default defineConfig(
  defineLernaVitestConfig({
    projectRoot: "libs/commands/publish",
    test: {
      testTimeout: 120e3,
      // Point npm config at a fixture instead of the developer's real ~/.npmrc
      // so tests that read npm config (e.g. the npm-conf snapshot passed to
      // pack-directory) are hermetic.
      setupFiles: ["../../test-helpers/src/lib/npm/set-npm-userconfig.ts"],
    },
  })
);
