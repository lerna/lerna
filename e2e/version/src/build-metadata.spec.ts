import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(
      normalizeEnvironment(str.replaceAll(/\(\d\d\d\d-\d\d-\d\d\)/g, "({YYYY}-{MM}-{DD})"))
    );
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-build-metadata", () => {
  describe("single package", () => {
    let fixture: Fixture;

    beforeEach(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-version-build-metadata",
        packageManager: "npm",
        initializeGit: true,
        runLernaInit: true,
        installDependencies: true,
      });
      await fixture.createInitialGitCommit();
      await fixture.lerna("create package-a -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-a'");
      await fixture.exec("git push origin test-main");
    });
    afterEach(() => fixture.destroy());

    it("should correctly generate build metadata", async () => {
      const output = await fixture.lerna("version 3.3.3 --build-metadata 001 -y", { silenceError: true });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed

        Changes:
         - package-a: 0.0.0 => 3.3.3+001

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
      expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
        v3.3.3+001

      `);

      const checkTagIsPresentOnRemote = await fixture.exec("git ls-remote origin refs/tags/v3.3.3+001");
      expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/v3.3.3+001

      `);

      expect(JSON.parse(await fixture.readWorkspaceFile("lerna.json")).version).toMatchInlineSnapshot(
        "3.3.3+001"
      );

      expect(JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json")).version).toEqual(
        "3.3.3+001"
      );
    });
  });

  describe("multiple packages", () => {
    let fixture: Fixture;

    beforeEach(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-version-build-metadata",
        packageManager: "npm",
        initializeGit: true,
        runLernaInit: true,
        installDependencies: true,
      });
      await fixture.createInitialGitCommit();
      await fixture.lerna("create package-a -y");
      await fixture.lerna("create package-b -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-a and package-b'");
      await fixture.exec("git push origin test-main");
    });
    afterEach(() => fixture.destroy());

    it("should correctly generate build metadata", async () => {
      const output = await fixture.lerna("version 3.3.3 --build-metadata exp.sha.SHA -y", {
        silenceError: true,
      });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed

        Changes:
         - package-a: 0.0.0 => 3.3.3+exp.sha.SHA
         - package-b: 0.0.0 => 3.3.3+exp.sha.SHA

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      const checkTagIsPresentLocally = await fixture.exec("git describe --abbrev=0");
      expect(checkTagIsPresentLocally.combinedOutput).toMatchInlineSnapshot(`
        v3.3.3+exp.sha.SHA

      `);

      const checkTagIsPresentOnRemote = await fixture.exec(
        "git ls-remote origin refs/tags/v3.3.3+exp.sha.SHA"
      );
      expect(checkTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/v3.3.3+exp.sha.SHA

      `);

      expect(JSON.parse(await fixture.readWorkspaceFile("lerna.json")).version).toMatchInlineSnapshot(
        "3.3.3+exp.sha.SHA"
      );

      expect(JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json")).version).toEqual(
        "3.3.3+exp.sha.SHA"
      );

      expect(JSON.parse(await fixture.readWorkspaceFile("packages/package-b/package.json")).version).toEqual(
        "3.3.3+exp.sha.SHA"
      );
    });
  });

  describe("independent packages", () => {
    let fixture: Fixture;

    beforeEach(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-version-build-metadata",
        packageManager: "npm",
        initializeGit: true,
        runLernaInit: true,
        installDependencies: true,
      });
      await fixture.createInitialGitCommit();
      fixture.updateJson("lerna.json", (json) => {
        // eslint-disable-next-line no-param-reassign
        json.version = "independent";
        return json;
      });
      await fixture.lerna("create package-a -y");
      await fixture.lerna("create package-b -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-a and package-b'");
      await fixture.exec("git push origin test-main");
    });
    afterEach(() => fixture.destroy());

    it("should correctly generate changelog and version information when releasing packages independently", async () => {
      // Initial versioning with two packages created
      const output = await fixture.lerna("version 3.3.3 --build-metadata 001 -y", { silenceError: true });

      // NOTE: In the independent case, lerna started with verion 1.0.0 as its assumed baseline (not 0.0.0 as in the fixed mode case)
      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info versioning independent
        lerna info Assuming all packages changed

        Changes:
         - package-a: 1.0.0 => 3.3.3+001
         - package-b: 1.0.0 => 3.3.3+001

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      // It should create one tag for each independently versioned package
      const checkPackageTagsArePresentLocally = await fixture.exec("git describe --abbrev=0");
      expect(checkPackageTagsArePresentLocally.combinedOutput).toMatchInlineSnapshot(`
        package-a@3.3.3+001

      `);

      const checkPackageATagIsPresentOnRemote = await fixture.exec(
        "git ls-remote origin refs/tags/package-a@3.3.3+001"
      );
      expect(checkPackageATagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/package-a@3.3.3+001

      `);
      const checkPackageBTagIsPresentOnRemote = await fixture.exec(
        "git ls-remote origin refs/tags/package-b@3.3.3+001"
      );
      expect(checkPackageBTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
        {FULL_COMMIT_SHA}	refs/tags/package-b@3.3.3+001

      `);

      // The lerna.json version field should not be updated with any particular version when in independent mode
      expect(JSON.parse(await fixture.readWorkspaceFile("lerna.json")).version).toMatchInlineSnapshot(
        "independent"
      );

      expect(JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json")).version).toEqual(
        "3.3.3+001"
      );

      expect(JSON.parse(await fixture.readWorkspaceFile("packages/package-b/package.json")).version).toEqual(
        "3.3.3+001"
      );
    });
  });
});
