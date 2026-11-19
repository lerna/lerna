import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return normalizeEnvironment(str);
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-repair", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-repair",
      packageManager: "npm",
      initializeGit: true,
      lernaInit: { args: [`--packages="packages/*"`] },
      installDependencies: true,
    });
  });
  afterAll(() => fixture.destroy());

  it("should run any existing migrations", async () => {
    const output = await fixture.lerna("repair");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      Running the following migrations:
      - lerna: remove-unnecessary-use-nx — Remove unnecessary \`useNx: true\` from lerna.json as it is the default
      - lerna: remove-invalid-init-config — Remove invalid \`init\` config from lerna.json as it is no longer applicable, given init cannot be run on an existing workspace
      - lerna: remove-invalid-lerna-config — Remove invalid \`lerna\` config from lerna.json as it is no longer used for anything
      - lerna: remove-invalid-use-workspaces — Remove invalid \`useWorkspaces\` config from lerna.json as it no longer exists
      - lerna: update-options-from-legacy-deprecate-config — Migrate legacy deprecated config usage to their updated counterparts
      - lerna: add-schema-config — Add \`$schema\` config to lerna.json if not already present to allow for IDE validation of lerna.json
      - nx: 16.0.0-remove-nrwl-cli — Remove @nrwl/cli.
      - nx: 16.0.0-update-nx-cloud-runner — Replace @nrwl/nx-cloud with nx-cloud
      - nx: 16.0.0-tokens-for-depends-on — Replace \`dependsOn.projects\` and \`inputs\` definitions with new configuration format.
      - nx: 16.2.0-remove-output-path-from-run-commands — Remove outputPath from run commands
      - nx: 16.6.0-prefix-outputs — Prefix outputs with {workspaceRoot}/{projectRoot} if needed
      - nx: 17.0.0-move-cache-directory — Updates the default cache directory to .nx/cache
      - nx: 17.0.0-use-minimal-config-for-tasks-runner-options — Use minimal config for tasksRunnerOptions
      - nx: rm-default-collection-npm-scope — Migration for v17.0.0-rc.1
      - nx: 17.3.0-update-nx-wrapper — Updates the nx wrapper.
      - nx: move-default-base-to-nx-json-root — Moves affected.defaultBase to defaultBase in \`nx.json\`
      - nx: 19-2-0-move-graph-cache-directory — Updates the default workspace data directory to .nx/workspace-data
      - nx: 19-2-2-update-nx-wrapper — Updates the nx wrapper.
      - nx: move-use-daemon-process — Migration for v20.0.0-beta.7
      - nx: remove-legacy-cache — Removes the legacy cache configuration from nx.json
      - nx: remove-custom-tasks-runner — Removes the legacy cache configuration from nx.json
      - nx: release-version-config-changes — Updates release version config based on the breaking changes in Nx v21
      - nx: release-changelog-config-changes — Updates release changelog config based on the breaking changes in Nx v21
      - nx: 22-0-0-release-version-config-changes — Updates release version config based on the breaking changes in Nx v22
      - nx: 22-0-0-consolidate-release-tag-config — Consolidates releaseTag* options into nested releaseTag object structure
      - nx: 22-1-0-update-nx-wrapper — Updates the nx wrapper.
      - nx: 22-6-1-add-claude-worktrees-to-git-ignore — Adds .claude/worktrees to .gitignore
      - nx: 22-6-0-enable-analytics-prompt — Prompts to enable usage analytics
      - nx: 22-6-0-add-claude-settings-local-to-git-ignore — Adds .claude/settings.local.json to .gitignore
      - nx: 22-7-0-add-polygraph-to-git-ignore — Adds .nx/polygraph to .gitignore
      - nx: 22-7-0-add-self-healing-to-gitignore — Adds .nx/self-healing to .gitignore
      - nx: 23-0-0-add-migrate-runs-to-git-ignore — Adds .nx/migrate-runs to .gitignore
      - nx: 23-2-0-set-cache-on-executor-target-defaults — Sets "cache" on some executor-based target defaults whose caching was previously enabled by a target name default, maintaining compatibility with how cacheability resolved before Nx 23. Keys the migration cannot decide are left alone, and the targets resolving through them need "cache" set by hand.
      - nx: 24-0-0-move-custom-hashers-to-inputs — Finds local executors that declare a custom hasher, which is deprecated and will be removed in Nx 25. Rewriting a hasher as target inputs means reading what its code hashes, so the rewrite is driven by an AI prompt; the generator only reports each hasher.
      - nx: 24-0-0-enable-legacy-affected — Sets affected.legacy to true in nx.json so nx affected keeps selecting whole projects. Nx 24 selects individual affected tasks by default.
      - nx: 24-0-0-rename-ultracache-ignore-options — Renames the ultracache target options "ignoredReads" and "ignoredWrites" to "ignoreReads" and "ignoreWrites", and renames .nx/workflows/sandboxing-config.yaml to ultracache-config.yaml with its "exclude-reads" and "exclude-writes" keys renamed to "ignore-reads" and "ignore-writes".

      ── Migration 1 of 36 · lerna:remove-unnecessary-use-nx ──────────────────
      → Running generator…
      Ran remove-unnecessary-use-nx from lerna
        Remove unnecessary \`useNx: true\` from lerna.json as it is the default

      No changes were made


      ── Migration 2 of 36 · lerna:remove-invalid-init-config ─────────────────
      → Running generator…
      Ran remove-invalid-init-config from lerna
        Remove invalid \`init\` config from lerna.json as it is no longer applicable, given init cannot be run on an existing workspace

      No changes were made


      ── Migration 3 of 36 · lerna:remove-invalid-lerna-config ────────────────
      → Running generator…
      Ran remove-invalid-lerna-config from lerna
        Remove invalid \`lerna\` config from lerna.json as it is no longer used for anything

      No changes were made


      ── Migration 4 of 36 · lerna:remove-invalid-use-workspaces ──────────────
      → Running generator…
      Ran remove-invalid-use-workspaces from lerna
        Remove invalid \`useWorkspaces\` config from lerna.json as it no longer exists

      No changes were made


      ── Migration 5 of 36 · lerna:update-options-from-legacy-deprecate-config ───
      → Running generator…
      Ran update-options-from-legacy-deprecate-config from lerna
        Migrate legacy deprecated config usage to their updated counterparts

      No changes were made


      ── Migration 6 of 36 · lerna:add-schema-config ──────────────────────────
      → Running generator…
      Ran add-schema-config from lerna
        Add \`$schema\` config to lerna.json if not already present to allow for IDE validation of lerna.json

      No changes were made


      ── Migration 7 of 36 · nx:16.0.0-remove-nrwl-cli ────────────────────────
      → Running generator…
      Ran 16.0.0-remove-nrwl-cli from nx
        Remove @nrwl/cli.

      No changes were made


      ── Migration 8 of 36 · nx:16.0.0-update-nx-cloud-runner ─────────────────
      → Running generator…
      Ran 16.0.0-update-nx-cloud-runner from nx
        Replace @nrwl/nx-cloud with nx-cloud

      No changes were made


      ── Migration 9 of 36 · nx:16.0.0-tokens-for-depends-on ──────────────────
      → Running generator…
      Ran 16.0.0-tokens-for-depends-on from nx
        Replace \`dependsOn.projects\` and \`inputs\` definitions with new configuration format.

      No changes were made


      ── Migration 10 of 36 · nx:16.2.0-remove-output-path-from-run-commands ───
      → Running generator…
      Ran 16.2.0-remove-output-path-from-run-commands from nx
        Remove outputPath from run commands

      No changes were made


      ── Migration 11 of 36 · nx:16.6.0-prefix-outputs ────────────────────────
      → Running generator…
      Ran 16.6.0-prefix-outputs from nx
        Prefix outputs with {workspaceRoot}/{projectRoot} if needed

      No changes were made


      ── Migration 12 of 36 · nx:17.0.0-move-cache-directory ──────────────────
      → Running generator…
      Ran 17.0.0-move-cache-directory from nx
        Updates the default cache directory to .nx/cache

      No changes were made


      ── Migration 13 of 36 · nx:17.0.0-use-minimal-config-for-tasks-runner-options ───
      → Running generator…
      Ran 17.0.0-use-minimal-config-for-tasks-runner-options from nx
        Use minimal config for tasksRunnerOptions

      No changes were made


      ── Migration 14 of 36 · nx:rm-default-collection-npm-scope ──────────────
      → Running generator…
      Ran rm-default-collection-npm-scope from nx
        Migration for v17.0.0-rc.1

      No changes were made


      ── Migration 15 of 36 · nx:17.3.0-update-nx-wrapper ─────────────────────
      → Running generator…
      Ran 17.3.0-update-nx-wrapper from nx
        Updates the nx wrapper.

      No changes were made


      ── Migration 16 of 36 · nx:move-default-base-to-nx-json-root ────────────
      → Running generator…
      Ran move-default-base-to-nx-json-root from nx
        Moves affected.defaultBase to defaultBase in \`nx.json\`

      No changes were made


      ── Migration 17 of 36 · nx:19-2-0-move-graph-cache-directory ────────────
      → Running generator…
      Ran 19-2-0-move-graph-cache-directory from nx
        Updates the default workspace data directory to .nx/workspace-data

      No changes were made


      ── Migration 18 of 36 · nx:19-2-2-update-nx-wrapper ─────────────────────
      → Running generator…
      Ran 19-2-2-update-nx-wrapper from nx
        Updates the nx wrapper.

      No changes were made


      ── Migration 19 of 36 · nx:move-use-daemon-process ──────────────────────
      → Running generator…
      Ran move-use-daemon-process from nx
        Migration for v20.0.0-beta.7

      No changes were made


      ── Migration 20 of 36 · nx:remove-legacy-cache ──────────────────────────
      → Running generator…
      Ran remove-legacy-cache from nx
        Removes the legacy cache configuration from nx.json

      No changes were made


      ── Migration 21 of 36 · nx:remove-custom-tasks-runner ───────────────────
      → Running generator…
      Ran remove-custom-tasks-runner from nx
        Removes the legacy cache configuration from nx.json

      No changes were made


      ── Migration 22 of 36 · nx:release-version-config-changes ───────────────
      → Running generator…
      Ran release-version-config-changes from nx
        Updates release version config based on the breaking changes in Nx v21

      No changes were made


      ── Migration 23 of 36 · nx:release-changelog-config-changes ─────────────
      → Running generator…
      Ran release-changelog-config-changes from nx
        Updates release changelog config based on the breaking changes in Nx v21

      No changes were made


      ── Migration 24 of 36 · nx:22-0-0-release-version-config-changes ────────
      → Running generator…
      Ran 22-0-0-release-version-config-changes from nx
        Updates release version config based on the breaking changes in Nx v22

      No changes were made


      ── Migration 25 of 36 · nx:22-0-0-consolidate-release-tag-config ────────
      → Running generator…
      Ran 22-0-0-consolidate-release-tag-config from nx
        Consolidates releaseTag* options into nested releaseTag object structure

      No changes were made


      ── Migration 26 of 36 · nx:22-1-0-update-nx-wrapper ─────────────────────
      → Running generator…
      Ran 22-1-0-update-nx-wrapper from nx
        Updates the nx wrapper.

      No changes were made


      ── Migration 27 of 36 · nx:22-6-1-add-claude-worktrees-to-git-ignore ────
      → Running generator…
      Ran 22-6-1-add-claude-worktrees-to-git-ignore from nx
        Adds .claude/worktrees to .gitignore

      No changes were made


      ── Migration 28 of 36 · nx:22-6-0-enable-analytics-prompt ───────────────
      → Running generator…
      Ran 22-6-0-enable-analytics-prompt from nx
        Prompts to enable usage analytics

      No changes were made


      ── Migration 29 of 36 · nx:22-6-0-add-claude-settings-local-to-git-ignore ───
      → Running generator…
      Ran 22-6-0-add-claude-settings-local-to-git-ignore from nx
        Adds .claude/settings.local.json to .gitignore

      No changes were made


      ── Migration 30 of 36 · nx:22-7-0-add-polygraph-to-git-ignore ───────────
      → Running generator…
      Ran 22-7-0-add-polygraph-to-git-ignore from nx
        Adds .nx/polygraph to .gitignore

      No changes were made


      ── Migration 31 of 36 · nx:22-7-0-add-self-healing-to-gitignore ─────────
      → Running generator…
      Ran 22-7-0-add-self-healing-to-gitignore from nx
        Adds .nx/self-healing to .gitignore

      No changes were made


      ── Migration 32 of 36 · nx:23-0-0-add-migrate-runs-to-git-ignore ────────
      → Running generator…
      Ran 23-0-0-add-migrate-runs-to-git-ignore from nx
        Adds .nx/migrate-runs to .gitignore

      No changes were made


      ── Migration 33 of 36 · nx:23-2-0-set-cache-on-executor-target-defaults ───
      → Running generator…
      Ran 23-2-0-set-cache-on-executor-target-defaults from nx
        Sets "cache" on some executor-based target defaults whose caching was previously enabled by a target name default, maintaining compatibility with how cacheability resolved before Nx 23. Keys the migration cannot decide are left alone, and the targets resolving through them need "cache" set by hand.

      No changes were made


      ── Migration 34 of 36 · nx:24-0-0-move-custom-hashers-to-inputs ─────────
      → Running generator…
      Ran 24-0-0-move-custom-hashers-to-inputs from nx
        Finds local executors that declare a custom hasher, which is deprecated and will be removed in Nx 25. Rewriting a hasher as target inputs means reading what its code hashes, so the rewrite is driven by an AI prompt; the generator only reports each hasher.

      No changes were made


      ── Migration 35 of 36 · nx:24-0-0-enable-legacy-affected ────────────────
      → Running generator…
      Ran 24-0-0-enable-legacy-affected from nx
        Sets affected.legacy to true in nx.json so nx affected keeps selecting whole projects. Nx 24 selects individual affected tasks by default.

      No changes were made


      ── Migration 36 of 36 · nx:24-0-0-rename-ultracache-ignore-options ──────
      → Running generator…
      Ran 24-0-0-rename-ultracache-ignore-options from nx
        Renames the ultracache target options "ignoredReads" and "ignoredWrites" to "ignoreReads" and "ignoreWrites", and renames .nx/workflows/sandboxing-config.yaml to ultracache-config.yaml with its "exclude-reads" and "exclude-writes" keys renamed to "ignore-reads" and "ignore-writes".

      No changes were made



       Lerna   No changes were necessary. This workspace is up to date!
    `);
  });
});
