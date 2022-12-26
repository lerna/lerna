import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-positional-arguments", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-positional-arguments",
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

  it("should support setting a specific version imperatively", async () => {
    const output = await fixture.lerna("version 3.3.3 -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 3.3.3

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
  });

  it("should support bumping the major version with the semver keyword", async () => {
    const output = await fixture.lerna("version major -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 1.0.0

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
      {FULL_COMMIT_SHA}	refs/tags/v1.0.0

    `);
  });

  it("should support bumping the minor version with the semver keyword", async () => {
    const output = await fixture.lerna("version minor -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 0.1.0

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
      {FULL_COMMIT_SHA}	refs/tags/v0.1.0

    `);
  });

  it("should support bumping the patch version with the semver keyword", async () => {
    const output = await fixture.lerna("version patch -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 0.0.1

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
      {FULL_COMMIT_SHA}	refs/tags/v0.0.1

    `);
  });

  it("should support bumping the premajor version with the semver keyword", async () => {
    const output = await fixture.lerna("version premajor -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 1.0.0-alpha.0

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
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 0.1.0-alpha.0

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
      {FULL_COMMIT_SHA}	refs/tags/v0.1.0-alpha.0

    `);
  });

  it("should support bumping the prepatch version with the semver keyword", async () => {
    const output = await fixture.lerna("version prepatch -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 0.0.1-alpha.0

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
      {FULL_COMMIT_SHA}	refs/tags/v0.0.1-alpha.0

    `);
  });

  it("should support bumping the prerelease version with the semver keyword", async () => {
    const output = await fixture.lerna("version prerelease -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 0.0.1-alpha.0

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
      {FULL_COMMIT_SHA}	refs/tags/v0.0.1-alpha.0

    `);
  });
});
