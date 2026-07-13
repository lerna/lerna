import { defineConfig } from "vitest/config";
import { defineLernaVitestConfig } from "../../vitest.shared";

export default defineConfig(
  defineLernaVitestConfig({
    projectRoot: "libs/core",
    test: {
      testTimeout: 45e3,
      // Point npm config at a fixture instead of the developer's real ~/.npmrc
      // so tests that read npm config (run-lifecycle, pack-directory,
      // map-to-registry) are hermetic.
      setupFiles: ["../test-helpers/src/lib/npm/set-npm-userconfig.ts"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/__fixtures__/**",
        // These vendored config-chain suites fail on windows (TODO: investigate
        // why) - previously skipped via --testPathIgnorePatterns in the windows
        // CI job, but a config-level skip also covers local windows development
        ...(process.platform === "win32"
          ? [
              "**/config-chain/tests/save.spec.ts",
              "**/config-chain/tests/find-file.spec.ts",
              "**/config-chain/tests/chain-class.spec.ts",
            ]
          : []),
      ],
    },
  })
);
