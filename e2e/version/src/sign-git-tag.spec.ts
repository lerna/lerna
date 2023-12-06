import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-sign-git-tag", () => {
  describe("single package", () => {
    let fixture: Fixture;

    beforeEach(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-version-sign-git-tag",
        packageManager: "npm",
        initializeGit: true,
        lernaInit: { args: [`--packages="packages/*"`] },
        installDependencies: true,
      });
      await fixture.lerna("create package-a -y");
      await fixture.createInitialGitCommit();
      await fixture.exec("git push origin test-main");
    });
    afterEach(() => fixture.destroy());

    it("should create tags that match version when not using --sign-git-tag", async () => {
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

    it("should create tags that match version when using --sign-git-tag", async () => {
      const output = await fixture.lerna("version 3.4.5 --sign-git-tag -y");
      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed

        Changes:
         - package-a: 0.0.0 => 3.4.5

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
      expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
        v3.4.5

      `);

      const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v3.4.5");
      expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/v3.4.5

      `);
    });
  });

  describe("multiple packages", () => {
    let fixture: Fixture;

    beforeEach(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-version-sign-git-tag-multiple-packages",
        packageManager: "npm",
        initializeGit: true,
        lernaInit: { args: [`--packages="packages/*"`] },
        installDependencies: true,
      });
      await fixture.lerna("create package-a -y");
      await fixture.lerna("create package-b -y");
      await fixture.createInitialGitCommit();
      await fixture.exec("git push origin test-main");
    });
    afterEach(() => fixture.destroy());

    it("should create tags that match version when not using --sign-git-tag", async () => {
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
    });

    it("should create tags that match version when using --sign-git-tag", async () => {
      const output = await fixture.lerna("version 3.4.5 --sign-git-tag -y");
      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed

        Changes:
         - package-a: 0.0.0 => 3.4.5
         - package-b: 0.0.0 => 3.4.5

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
      expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
        v3.4.5

      `);

      const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v3.4.5");
      expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/v3.4.5

      `);
    });
  });

  describe("independent packages", () => {
    let fixture: Fixture;

    beforeEach(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-version-sign-git-tag-multiple-packages",
        packageManager: "npm",
        initializeGit: true,
        lernaInit: { args: [`--packages="packages/*" --independent`] },
        installDependencies: true,
      });
      await fixture.lerna("create package-a -y");
      await fixture.lerna("create package-b -y");
      await fixture.createInitialGitCommit();
      await fixture.exec("git push origin test-main");
    });
    afterEach(() => fixture.destroy());

    it("should create tags that match version when not using --sign-git-tag", async () => {
      const output = await fixture.lerna("version 3.3.3 -y");

      // NOTE: In the independent case, lerna started with version 1.0.0 as its assumed baseline (not 0.0.0 as in the fixed mode case)
      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info versioning independent
        lerna info Assuming all packages changed

        Changes:
         - package-a: 1.0.0 => 3.3.3
         - package-b: 1.0.0 => 3.3.3

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      // It should create one tag for each independently versioned package
      const checkPackageTagsArePresentLocally = await fixture.exec("git describe --abbrev=0");
      expect(checkPackageTagsArePresentLocally.combinedOutput).toMatchInlineSnapshot(`
        package-a@3.3.3

      `);

      const checkPackageATagIsPresentOnRemote = await fixture.exec(
        "git ls-remote origin refs/tags/package-a@3.3.3"
      );
      expect(checkPackageATagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/package-a@3.3.3

      `);
      const checkPackageBTagIsPresentOnRemote = await fixture.exec(
        "git ls-remote origin refs/tags/package-b@3.3.3"
      );
      expect(checkPackageBTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/package-b@3.3.3

      `);
    });

    it("should create tags that match version when using --sign-git-tag", async () => {
      const output = await fixture.lerna("version 3.4.5 --sign-git-tag -y");

      // NOTE: In the independent case, lerna started with version 1.0.0 as its assumed baseline (not 0.0.0 as in the fixed mode case)
      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info versioning independent
        lerna info Assuming all packages changed

        Changes:
         - package-a: 1.0.0 => 3.4.5
         - package-b: 1.0.0 => 3.4.5

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      // It should create one tag for each independently versioned package
      const checkPackageTagsArePresentLocally = await fixture.exec("git describe --abbrev=0");
      expect(checkPackageTagsArePresentLocally.combinedOutput).toMatchInlineSnapshot(`
        package-a@3.4.5

      `);

      const checkPackageATagIsPresentOnRemote = await fixture.exec(
        "git ls-remote origin refs/tags/package-a@3.4.5"
      );
      expect(checkPackageATagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/package-a@3.4.5

      `);
      const checkPackageBTagIsPresentOnRemote = await fixture.exec(
        "git ls-remote origin refs/tags/package-b@3.4.5"
      );
      expect(checkPackageBTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/package-b@3.4.5

      `);
    });
  });
});
