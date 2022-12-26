import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-with-workspaces", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-with-workspaces",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: false,
      installDependencies: false,
    });
    await fixture.lernaInit("", { keepDefaultOptions: true });
    await fixture.install();

    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y --dependencies package-a");
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });
  afterEach(() => fixture.destroy());

  it("should support setting a specific version imperatively and update root lockfile", async () => {
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

    const packageLockJson = await fixture.readWorkspaceFile("package-lock.json");
    const packages = JSON.parse(packageLockJson).packages;

    expect(packages["packages/package-a"].version).toEqual("3.3.3");
    expect(packages["packages/package-b"].version).toEqual("3.3.3");
    expect(packages["packages/package-b"].dependencies["package-a"]).toEqual("^3.3.3");
  });

  it("should not run npm install lifecycle scripts, but still update package-lock.json", async () => {
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
    await fixture.exec("git commit -m 'update package.json with failing install lifecycle scripts'");

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

    const packageLockJson = await fixture.readWorkspaceFile("package-lock.json");
    const packages = JSON.parse(packageLockJson).packages;

    expect(packages["packages/package-a"].version).toEqual("3.3.3");
    expect(packages["packages/package-b"].version).toEqual("3.3.3");
    expect(packages["packages/package-b"].dependencies["package-a"]).toEqual("^3.3.3");
  });
});
