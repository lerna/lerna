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
      - lerna: remove-unnecessary-use-nx (Remove unnecessary \`useNx: true\` from lerna.json as it is the default)
      - lerna: remove-invalid-init-config (Remove invalid \`init\` config from lerna.json as it is no longer applicable, given init cannot be run on an existing workspace)
      - lerna: remove-invalid-lerna-config (Remove invalid \`lerna\` config from lerna.json as it is no longer used for anything)
      - lerna: remove-invalid-use-workspaces (Remove invalid \`useWorkspaces\` config from lerna.json as it no longer exists)
      - lerna: update-options-from-legacy-deprecate-config (Migrate legacy deprecated config usage to their updated counterparts)
      - lerna: add-schema-config (Add \`$schema\` config to lerna.json if not already present to allow for IDE validation of lerna.json)
      - nx: 16.0.0-remove-nrwl-cli (Remove @nrwl/cli.)
      - nx: 16.0.0-update-nx-cloud-runner (Replace @nrwl/nx-cloud with nx-cloud)
      - nx: 16.0.0-tokens-for-depends-on (Replace \`dependsOn.projects\` and \`inputs\` definitions with new configuration format.)
      - nx: 16.2.0-remove-output-path-from-run-commands (Remove outputPath from run commands)
      - nx: 16.6.0-prefix-outputs (Prefix outputs with {workspaceRoot}/{projectRoot} if needed)
      - nx: 17.0.0-move-cache-directory (Updates the default cache directory to .nx/cache)
      - nx: 17.0.0-use-minimal-config-for-tasks-runner-options (Use minimal config for tasksRunnerOptions)
      - nx: rm-default-collection-npm-scope (Migration for v17.0.0-rc.1)
      - nx: 17.3.0-update-nx-wrapper (Updates the nx wrapper.)
      - nx: move-default-base-to-nx-json-root (Moves affected.defaultBase to defaultBase in \`nx.json\`)
      - nx: 19-2-0-move-graph-cache-directory (Updates the default workspace data directory to .nx/workspace-data)
      - nx: 19-2-2-update-nx-wrapper (Updates the nx wrapper.)
      - nx: move-use-daemon-process (Migration for v20.0.0-beta.7)
      - nx: remove-legacy-cache (Removes the legacy cache configuration from nx.json)
      - nx: remove-custom-tasks-runner (Removes the legacy cache configuration from nx.json)
      - nx: release-version-config-changes (Updates release version config based on the breaking changes in Nx v21)
      - nx: release-changelog-config-changes (Updates release changelog config based on the breaking changes in Nx v21)
      - nx: 22-0-0-release-version-config-changes (Updates release version config based on the breaking changes in Nx v22)
      - nx: 22-0-0-consolidate-release-tag-config (Consolidates releaseTag* options into nested releaseTag object structure)
      - nx: 22-1-0-update-nx-wrapper (Updates the nx wrapper.)
      ---------------------------------------------------------

      Running migration lerna: remove-unnecessary-use-nx
      Ran remove-unnecessary-use-nx from lerna
        Remove unnecessary \`useNx: true\` from lerna.json as it is the default

      No changes were made

      ---------------------------------------------------------
      Running migration lerna: remove-invalid-init-config
      Ran remove-invalid-init-config from lerna
        Remove invalid \`init\` config from lerna.json as it is no longer applicable, given init cannot be run on an existing workspace

      No changes were made

      ---------------------------------------------------------
      Running migration lerna: remove-invalid-lerna-config
      Ran remove-invalid-lerna-config from lerna
        Remove invalid \`lerna\` config from lerna.json as it is no longer used for anything

      No changes were made

      ---------------------------------------------------------
      Running migration lerna: remove-invalid-use-workspaces
      Ran remove-invalid-use-workspaces from lerna
        Remove invalid \`useWorkspaces\` config from lerna.json as it no longer exists

      No changes were made

      ---------------------------------------------------------
      Running migration lerna: update-options-from-legacy-deprecate-config
      Ran update-options-from-legacy-deprecate-config from lerna
        Migrate legacy deprecated config usage to their updated counterparts

      No changes were made

      ---------------------------------------------------------
      Running migration lerna: add-schema-config
      Ran add-schema-config from lerna
        Add \`$schema\` config to lerna.json if not already present to allow for IDE validation of lerna.json

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 16.0.0-remove-nrwl-cli
      Ran 16.0.0-remove-nrwl-cli from nx
        Remove @nrwl/cli.

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 16.0.0-update-nx-cloud-runner
      Ran 16.0.0-update-nx-cloud-runner from nx
        Replace @nrwl/nx-cloud with nx-cloud

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 16.0.0-tokens-for-depends-on
      Ran 16.0.0-tokens-for-depends-on from nx
        Replace \`dependsOn.projects\` and \`inputs\` definitions with new configuration format.

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 16.2.0-remove-output-path-from-run-commands
      Ran 16.2.0-remove-output-path-from-run-commands from nx
        Remove outputPath from run commands

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 16.6.0-prefix-outputs
      Ran 16.6.0-prefix-outputs from nx
        Prefix outputs with {workspaceRoot}/{projectRoot} if needed

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 17.0.0-move-cache-directory
      Ran 17.0.0-move-cache-directory from nx
        Updates the default cache directory to .nx/cache

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 17.0.0-use-minimal-config-for-tasks-runner-options
      Ran 17.0.0-use-minimal-config-for-tasks-runner-options from nx
        Use minimal config for tasksRunnerOptions

      No changes were made

      ---------------------------------------------------------
      Running migration nx: rm-default-collection-npm-scope
      Ran rm-default-collection-npm-scope from nx
        Migration for v17.0.0-rc.1

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 17.3.0-update-nx-wrapper
      Ran 17.3.0-update-nx-wrapper from nx
        Updates the nx wrapper.

      No changes were made

      ---------------------------------------------------------
      Running migration nx: move-default-base-to-nx-json-root
      Ran move-default-base-to-nx-json-root from nx
        Moves affected.defaultBase to defaultBase in \`nx.json\`

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 19-2-0-move-graph-cache-directory
      Ran 19-2-0-move-graph-cache-directory from nx
        Updates the default workspace data directory to .nx/workspace-data

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 19-2-2-update-nx-wrapper
      Ran 19-2-2-update-nx-wrapper from nx
        Updates the nx wrapper.

      No changes were made

      ---------------------------------------------------------
      Running migration nx: move-use-daemon-process
      Ran move-use-daemon-process from nx
        Migration for v20.0.0-beta.7

      No changes were made

      ---------------------------------------------------------
      Running migration nx: remove-legacy-cache
      Ran remove-legacy-cache from nx
        Removes the legacy cache configuration from nx.json

      No changes were made

      ---------------------------------------------------------
      Running migration nx: remove-custom-tasks-runner
      Ran remove-custom-tasks-runner from nx
        Removes the legacy cache configuration from nx.json

      No changes were made

      ---------------------------------------------------------
      Running migration nx: release-version-config-changes
      Ran release-version-config-changes from nx
        Updates release version config based on the breaking changes in Nx v21

      No changes were made

      ---------------------------------------------------------
      Running migration nx: release-changelog-config-changes
      Ran release-changelog-config-changes from nx
        Updates release changelog config based on the breaking changes in Nx v21

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 22-0-0-release-version-config-changes
      Ran 22-0-0-release-version-config-changes from nx
        Updates release version config based on the breaking changes in Nx v22

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 22-0-0-consolidate-release-tag-config
      Ran 22-0-0-consolidate-release-tag-config from nx
        Consolidates releaseTag* options into nested releaseTag object structure

      No changes were made

      ---------------------------------------------------------
      Running migration nx: 22-1-0-update-nx-wrapper
      Ran 22-1-0-update-nx-wrapper from nx
        Updates the nx wrapper.

      No changes were made

      ---------------------------------------------------------

       Lerna   No changes were necessary. This workspace is up to date!


    `);
  });
});
