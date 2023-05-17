import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str);
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-from-remote", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-from-remote",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create from-remote-1 -y");
    await fixture.lerna("create from-remote-2 -y");
    await fixture.lerna("create from-remote-3 -y");

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });

  afterEach(() => fixture.destroy());

  it("should use registry version as base for version bump", async () => {
    await fixture.updatePackageVersion({ packagePath: "packages/from-remote-1", newVersion: "1.2.4" });
    await fixture.updatePackageVersion({ packagePath: "packages/from-remote-2", newVersion: "1.2.4" });
    await fixture.updatePackageVersion({ packagePath: "packages/from-remote-3", newVersion: "1.2.4" });
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: set version to 1.2.4'");

    // publish packages at version 1.2.4, then reset the local changes.
    // notice that lerna.json's version was never set to 1.2.4, so it remains at the default from lerna init.
    await fixture.lerna("publish from-package -y --registry http://localhost:4872");
    await fixture.exec("git reset --hard HEAD~1");

    // lerna should ignore lerna.json and pick version 1.3.0 since it is the next minor version after 1.2.4
    const result = await fixture.lerna(
      "version minor --from-remote from-remote-1 --registry http://localhost:4872 -y",
      { allowNetworkRequests: true }
    );

    // clean up published packages
    await fixture.exec(`npm unpublish --force from-remote-1 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-2 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-3 --registry=http://localhost:4872`);

    expect(result.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info Assuming all packages changed
      lerna info current version 1.2.4

      Changes:
       - from-remote-1: 0.0.0 => 1.3.0
       - from-remote-2: 0.0.0 => 1.3.0
       - from-remote-3: 0.0.0 => 1.3.0

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);
  });

  it("should respect .npmrc", async () => {
    // create .npmrc with registry instead of explicitly passing it to the version command
    await fixture.exec('echo "registry=http://localhost:4872" > .npmrc');
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: add .npmrc with registry'");

    await fixture.updatePackageVersion({ packagePath: "packages/from-remote-1", newVersion: "1.2.4" });
    await fixture.updatePackageVersion({ packagePath: "packages/from-remote-2", newVersion: "1.2.4" });
    await fixture.updatePackageVersion({ packagePath: "packages/from-remote-3", newVersion: "1.2.4" });
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: set version to 1.2.4'");

    // publish packages at version 1.2.4, then reset the local changes.
    // notice that lerna.json's version was never set to 1.2.4, so it remains at the default from lerna init.
    await fixture.lerna("publish from-package -y");
    await fixture.exec("git reset --hard HEAD~1");

    // lerna should ignore lerna.json and pick version 1.3.0 since it is the next minor version after 1.2.4
    const result = await fixture.lerna("version minor --from-remote from-remote-1 -y", {
      allowNetworkRequests: true,
    });

    // clean up published packages
    await fixture.exec(`npm unpublish --force from-remote-1`);
    await fixture.exec(`npm unpublish --force from-remote-2`);
    await fixture.exec(`npm unpublish --force from-remote-3`);

    expect(result.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info Assuming all packages changed
      lerna info current version 1.2.4

      Changes:
       - from-remote-1: 0.0.0 => 1.3.0
       - from-remote-2: 0.0.0 => 1.3.0
       - from-remote-3: 0.0.0 => 1.3.0

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);
  });

  it("throws an error when --from-remote is used with independent versioning mode", async () => {
    await fixture.updateJson("lerna.json", (json) => ({ ...json, version: "independent" }));

    const result = await fixture.lerna("version minor --from-remote from-remote-1 -y", {
      allowNetworkRequests: true,
      silenceError: true,
    });

    expect(result.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info versioning independent
      lerna ERR! EINDEPENDENT The --from-remote option is not supported in independent mode.

    `);
  });

  it("throws an error when --from-remote is passed without an argument", async () => {
    const result = await fixture.lerna("version minor --from-remote -y", {
      allowNetworkRequests: true,
      silenceError: true,
    });

    expect(result.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna ERR! EFROMREMOTE A package name to look up must be provided to the --from-remote option.

    `);
  });

  it("throws an error when version is not found for specified package", async () => {
    const result = await fixture.lerna(
      "version minor --from-remote from-remote-1 --registry http://localhost:4872 -y",
      { allowNetworkRequests: true, silenceError: true }
    );
    expect(result.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info Assuming all packages changed
      lerna ERR! ENPMVIEW Could not get current version of from-remote-1 via \`npm view\`.
      lerna ERR! ENPMVIEW  Please verify that \`npm view from-remote-1\` completes successfully from the root of the workspace.

    `);
  });

  it("should use specified dist-tag for lookup", async () => {
    await fixture.updatePackageVersion({
      packagePath: "packages/from-remote-1",
      newVersion: "1.2.4",
    });
    await fixture.updatePackageVersion({
      packagePath: "packages/from-remote-2",
      newVersion: "1.2.4",
    });
    await fixture.updatePackageVersion({
      packagePath: "packages/from-remote-3",
      newVersion: "1.2.4",
    });
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: set version to 1.2.4'");

    // publish packages at version 1.2.4 to the "latest" tag
    await fixture.lerna("publish from-package -y --registry http://localhost:4872");

    await fixture.updatePackageVersion({
      packagePath: "packages/from-remote-1",
      newVersion: "1.2.5-alpha.0",
    });
    await fixture.updatePackageVersion({
      packagePath: "packages/from-remote-2",
      newVersion: "1.2.5-alpha.0",
    });
    await fixture.updatePackageVersion({
      packagePath: "packages/from-remote-3",
      newVersion: "1.2.5-alpha.0",
    });
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: set version to 1.2.5-alpha.0'");

    // publish packages at version 1.2.5-alpha.0 to the "next" tag
    await fixture.lerna("publish from-package --dist-tag next -y --registry http://localhost:4872");
    await fixture.exec("git reset --hard HEAD~2");

    // at this point, `npm view from-remote-1 dist-tags --json` will return { "latest": "1.2.4", "next": "1.2.5-alpha.0" }

    const result = await fixture.lerna(
      "version prerelease --from-remote from-remote-1 --dist-tag next --registry http://localhost:4872 -y",
      { allowNetworkRequests: true }
    );

    // clean up published packages
    await fixture.exec(`npm unpublish --force from-remote-1 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-2 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-3 --registry=http://localhost:4872`);

    expect(result.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info Assuming all packages changed
      lerna info current version 1.2.5-alpha.0

      Changes:
       - from-remote-1: 0.0.0 => 1.2.5-alpha.1
       - from-remote-2: 0.0.0 => 1.2.5-alpha.1
       - from-remote-3: 0.0.0 => 1.2.5-alpha.1

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);
  });

  it("should error if specified dist-tag is not found on the npm view response", async () => {
    await fixture.updatePackageVersion({
      packagePath: "packages/from-remote-1",
      newVersion: "1.2.4",
    });
    await fixture.updatePackageVersion({
      packagePath: "packages/from-remote-2",
      newVersion: "1.2.4",
    });
    await fixture.updatePackageVersion({
      packagePath: "packages/from-remote-3",
      newVersion: "1.2.4",
    });
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: set version to 1.2.4'");

    // publish packages at version 1.2.4 to the "latest" tag
    await fixture.lerna("publish from-package -y --registry http://localhost:4872");
    await fixture.exec("git reset --hard HEAD~1");

    // at this point, `npm view from-remote-1 dist-tags --json` will return { "latest": "1.2.4" }

    const result = await fixture.lerna(
      "version prerelease --from-remote from-remote-1 --dist-tag next --registry http://localhost:4872 -y",
      { allowNetworkRequests: true, silenceError: true }
    );

    // clean up published packages
    await fixture.exec(`npm unpublish --force from-remote-1 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-2 --registry=http://localhost:4872`);
    await fixture.exec(`npm unpublish --force from-remote-3 --registry=http://localhost:4872`);

    expect(result.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info Assuming all packages changed
      lerna ERR! ENODISTTAG No version found for from-remote-1@next.
      lerna ERR! ENODISTTAG  If you are trying to version based on a different tag than 'latest', ensure that it is provided with the --distTag option.

    `);
  });
});
