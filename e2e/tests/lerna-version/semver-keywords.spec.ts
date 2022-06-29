import { Fixture } from "../../utils/fixture";

expect.addSnapshotSerializer({
  serialize(str) {
    return str.replaceAll(/\b[0-9a-f]{40}\b/g, "GIT_COMMIT_SHA").replaceAll(/lerna info ci enabled\n/g, "");
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna version", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      name: "lerna-version-semver-keywords",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
    await fixture.lerna("create package-a -y");
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });
  afterEach(() => fixture.destroy());

  it("should support bumping the major version with the semver keyword", async () => {
    const output = await fixture.lerna("version major -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`

        Changes:
         - package-a: 0.0.0 => 1.0.0

        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v1.0.0

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v1.0.0");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      GIT_COMMIT_SHA	refs/tags/v1.0.0

    `);
  });

  it("should support bumping the minor version with the semver keyword", async () => {
    const output = await fixture.lerna("version minor -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`

        Changes:
         - package-a: 0.0.0 => 0.1.0

        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v0.1.0

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v0.1.0");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      GIT_COMMIT_SHA	refs/tags/v0.1.0

    `);
  });

  it("should support bumping the patch version with the semver keyword", async () => {
    const output = await fixture.lerna("version patch -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`

        Changes:
         - package-a: 0.0.0 => 0.0.1

        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v0.0.1

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v0.0.1");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      GIT_COMMIT_SHA	refs/tags/v0.0.1

    `);
  });

  it("should support bumping the premajor version with the semver keyword", async () => {
    const output = await fixture.lerna("version premajor -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`

        Changes:
         - package-a: 0.0.0 => 1.0.0-alpha.0

        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v1.0.0-alpha.0

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/1.0.0-alpha.0");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(``);
  });

  it("should support bumping the preminor version with the semver keyword", async () => {
    const output = await fixture.lerna("version preminor -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`

        Changes:
         - package-a: 0.0.0 => 0.1.0-alpha.0

        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v0.1.0-alpha.0

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v0.1.0-alpha.0");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      GIT_COMMIT_SHA	refs/tags/v0.1.0-alpha.0

    `);
  });

  it("should support bumping the prepatch version with the semver keyword", async () => {
    const output = await fixture.lerna("version prepatch -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`

        Changes:
         - package-a: 0.0.0 => 0.0.1-alpha.0

        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v0.0.1-alpha.0

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v0.0.1-alpha.0");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      GIT_COMMIT_SHA	refs/tags/v0.0.1-alpha.0

    `);
  });

  it("should support bumping the prerelease version with the semver keyword", async () => {
    const output = await fixture.lerna("version prerelease -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`

        Changes:
         - package-a: 0.0.0 => 0.0.1-alpha.0

        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

    `);

    const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
    expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
      v0.0.1-alpha.0

    `);

    const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v0.0.1-alpha.0");
    expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
      GIT_COMMIT_SHA	refs/tags/v0.0.1-alpha.0

    `);
  });
});
