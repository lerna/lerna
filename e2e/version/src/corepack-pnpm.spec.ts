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

describe("lerna-version-corepack", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-corepack",
      packageManager: "pnpm",
      initializeGit: true,
      lernaInit: { args: [`--packages="packages/*"`] },
      installDependencies: true,
    });
    await fixture.exec("corepack enable");
    await fixture.exec("corepack use pnpm");

    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y --dependencies package-a");
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });

  afterEach(async () => {
    await fixture.destroy();
  });

  it("should update pnpm-lock.yaml", async () => {
    const output = await fixture.lerna("version 3.4.0 -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 3.4.0
       - package-b: 0.0.0 => 3.4.0

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

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
            package-a: ^3.4.0,
          },
        },
      }
    `);
  });
});
