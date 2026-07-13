import { readFileSync } from "fs";
import { join } from "path";
import type { ViteUserConfig } from "vitest/config";

export interface LernaVitestOptions {
  /** Project root relative to the workspace root, e.g. "libs/core" */
  projectRoot: string;
  /** Per-project overrides merged over the shared test defaults */
  test?: NonNullable<ViteUserConfig["test"]>;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Explicit aliases for the workspace's @lerna/* imports, derived from
 * tsconfig.base.json. Unlike resolve.tsconfigPaths, these apply to every file
 * in the module graph, including files outside the current project's root
 * (e.g. the shared manual mocks in libs/test-helpers/__mocks__).
 */
function workspaceAliases(workspaceRoot: string): { find: RegExp; replacement: string }[] {
  const raw = readFileSync(join(workspaceRoot, "tsconfig.base.json"), "utf-8");
  const paths: Record<string, string[]> = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, "")).compilerOptions.paths;

  return Object.entries(paths).map(([key, [target]]) => {
    if (key.endsWith("/*")) {
      return {
        find: new RegExp(`^${escapeRegExp(key.slice(0, -2))}/(.*)$`),
        replacement: `${join(workspaceRoot, target.slice(0, -2))}/$1`,
      };
    }
    return { find: new RegExp(`^${escapeRegExp(key)}$`), replacement: join(workspaceRoot, target) };
  });
}

/**
 * Shared vitest configuration for the e2e test projects. E2E suites run their
 * spec files serially against the locally published lerna package and retry
 * flaky runs (previously jest.retryTimes(3) in each project's test-setup.ts).
 */
export function defineLernaE2eVitestConfig(options: LernaVitestOptions): ViteUserConfig {
  return defineLernaVitestConfig({
    ...options,
    test: {
      setupFiles: ["src/test-setup.ts"],
      // Unwrap snapshotted Error objects to their message (jest compatibility)
      // before the suites' own string serializers run.
      snapshotSerializers: [join(__dirname, "libs/e2e-utils/src/lib/serializers/serialize-error-message.ts")],
      testTimeout: 60000,
      // In Jest, testTimeout covered hooks too. Vitest separates hookTimeout
      // (default 10 s) from testTimeout, so fixtures that run npm install in
      // beforeEach/beforeAll need an explicit hook budget.
      hookTimeout: 60000,
      fileParallelism: false,
      retry: process.env.LERNA_E2E_DEBUG === "true" ? 0 : 3,
      ...options.test,
    },
  });
}

/**
 * Shared vitest configuration for all projects in the lerna workspace.
 * Mirrors the defaults the repo previously configured via jest.preset.js.
 */
export function defineLernaVitestConfig(options: LernaVitestOptions): ViteUserConfig {
  const depth = options.projectRoot.split("/").length;
  const offsetToWorkspaceRoot = "../".repeat(depth);
  // Vite bundles this file into each project's vitest.config.ts before
  // evaluating it, but esbuild injects a per-source-file __dirname, so this
  // still resolves to the workspace root where vitest.shared.ts lives.
  const workspaceRoot = __dirname;

  return {
    // Keep vite's dep cache in the workspace root's node_modules instead of
    // creating stray (untracked) node_modules dirs inside each project.
    cacheDir: join(workspaceRoot, "node_modules", ".vite", options.projectRoot),
    resolve: {
      alias: workspaceAliases(workspaceRoot),
      // Also resolve any remaining tsconfig paths (e.g. project-local ones)
      tsconfigPaths: true,
    },
    test: {
      globals: true,
      environment: "node",
      // The nx-inferred targets invoke bare `vitest`, which defaults to watch
      // mode in an interactive terminal - force single-run so `nx test` always
      // exits (`vitest --watch` still works explicitly).
      watch: false,
      include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/__fixtures__/**"],
      reporters: ["default"],
      // Match the snapshot format the repo used with jest (nx's jest preset kept
      // the pre-jest-29 format) so existing .snap files and inline snapshots
      // remain valid.
      snapshotFormat: { escapeString: true, printBasicPrototype: true },
      clearMocks: true,
      // Plugin isolation is not relevant to lerna or its tests (previously set
      // in jest-global-setup.js).
      env: { NX_ISOLATE_PLUGINS: "false" },
      coverage: {
        provider: "v8" as const,
        reportsDirectory: `${offsetToWorkspaceRoot}coverage/${options.projectRoot}`,
      },
      ...options.test,
    },
  };
}
