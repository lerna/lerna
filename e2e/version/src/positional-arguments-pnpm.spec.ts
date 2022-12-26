import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";
import { load } from "js-yaml";

interface PnpmLockfile {
  importers: {
    dependencies?: Record<string, string>;
    specifiers?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-positional-arguments-pnpm", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-positional-arguments",
      packageManager: "pnpm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y --dependencies package-a");
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });
  afterEach(() => fixture.destroy());

  it("should support setting a specific version imperatively", async () => {
    const output = await fixture.lerna("version 3.3.3 -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 3.3.3
       - package-b: 0.0.0 => 3.3.3

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v3.3.3

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v3.3.3");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      {FULL_COMMIT_SHA}	refs/tags/v3.3.3

    `);

    const pnpmLockfileContent = await fixture.readWorkspaceFile("pnpm-lock.yaml");
    const pnpmLockfileObject = <PnpmLockfile>load(pnpmLockfileContent);
    expect(pnpmLockfileObject.importers).toMatchInlineSnapshot(`
      Object {
        .: Object {
          devDependencies: Object {
            lerna: 999.9.9-e2e.0,
          },
          specifiers: Object {
            lerna: ^999.9.9-e2e.0,
          },
        },
        packages/package-a: Object {
          specifiers: Object {},
        },
        packages/package-b: Object {
          dependencies: Object {
            package-a: link:../package-a,
          },
          specifiers: Object {
            package-a: ^3.3.3,
          },
        },
      }
    `);
  });

  it("should support setting a specific version imperatively on packages using the workspace: protocol", async () => {
    await fixture.updateJson("packages/package-b/package.json", (pkg) => ({
      ...pkg,
      dependencies: {
        ...(pkg.dependencies as any),
        "package-a": "workspace:^0.0.0",
      },
    }));
    await fixture.exec("git add packages/package-b/package.json");
    await fixture.exec("git commit -m 'Add package-a dependency'");

    const output = await fixture.lerna("version 3.3.3 -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 3.3.3
       - package-b: 0.0.0 => 3.3.3

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v3.3.3

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v3.3.3");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      {FULL_COMMIT_SHA}	refs/tags/v3.3.3

    `);

    const pnpmLockfileContent = await fixture.readWorkspaceFile("pnpm-lock.yaml");
    const pnpmLockfileObject = load(pnpmLockfileContent) as any;
    expect(pnpmLockfileObject.importers).toMatchInlineSnapshot(`
      Object {
        .: Object {
          devDependencies: Object {
            lerna: 999.9.9-e2e.0,
          },
          specifiers: Object {
            lerna: ^999.9.9-e2e.0,
          },
        },
        packages/package-a: Object {
          specifiers: Object {},
        },
        packages/package-b: Object {
          dependencies: Object {
            package-a: link:../package-a,
          },
          specifiers: Object {
            package-a: workspace:^3.3.3,
          },
        },
      }
    `);
  });

  it("should not run pnpm install lifecycle scripts, but still update pnpm-lock.yaml", async () => {
    await fixture.updateJson("package.json", (json) => ({
      ...json,
      scripts: {
        preinstall: "exit 1",
        install: "exit 1",
        postinstall: "exit 1",
        prepublish: "exit 1",
        prepare: "exit 1",
      },
    }));
    await fixture.exec("git add package.json");
    await fixture.exec("git commit -m 'Add failing lifecycle scripts'");

    const output = await fixture.lerna("version 3.3.3 -y");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 3.3.3
       - package-b: 0.0.0 => 3.3.3

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v3.3.3

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v3.3.3");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      {FULL_COMMIT_SHA}	refs/tags/v3.3.3

    `);

    const pnpmLockfileContent = await fixture.readWorkspaceFile("pnpm-lock.yaml");
    const pnpmLockfileObject = <PnpmLockfile>load(pnpmLockfileContent);
    expect(pnpmLockfileObject.importers).toMatchInlineSnapshot(`
      Object {
        .: Object {
          devDependencies: Object {
            lerna: 999.9.9-e2e.0,
          },
          specifiers: Object {
            lerna: ^999.9.9-e2e.0,
          },
        },
        packages/package-a: Object {
          specifiers: Object {},
        },
        packages/package-b: Object {
          dependencies: Object {
            package-a: link:../package-a,
          },
          specifiers: Object {
            package-a: ^3.3.3,
          },
        },
      }
    `);
  });
});
