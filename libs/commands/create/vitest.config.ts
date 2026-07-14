import { defineConfig } from "vitest/config";
import { defineLernaVitestConfig } from "../../../vitest.shared";

export default defineConfig(
  defineLernaVitestConfig({
    projectRoot: "libs/commands/create",
    test: {
      // This project keeps its spec in __tests__/ rather than src/
      include: ["src/**/*.spec.ts", "src/**/*.test.ts", "__tests__/**/*.spec.ts"],
      // Point npm config at a fixture instead of the developer's real ~/.npmrc
      // (previously provided by the jest preset's setupFiles) so tests that
      // read npm config via npm-conf are hermetic.
      setupFiles: ["../../test-helpers/src/lib/npm/set-npm-userconfig.ts"],
    },
  })
);
