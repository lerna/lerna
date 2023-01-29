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

describe("lerna-version-conventional-commits", () => {
  describe("single package", () => {
    let fixture: Fixture;

    beforeEach(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-version-conventional-commits-single-package",
        packageManager: "npm",
        initializeGit: true,
        runLernaInit: true,
        installDependencies: true,
      });
    });
    afterEach(() => fixture.destroy());

    it("should correctly generate changelog and version information after a `feat` commit", async () => {
      await fixture.createInitialGitCommit();
      await fixture.lerna("create package-a -y");

      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-a'");
      await fixture.exec("git push origin test-main");

      const output = await fixture.lerna("version --conventional-commits -y", { silenceError: true });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

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

      expect(JSON.parse(await fixture.readWorkspaceFile("lerna.json")).version).toMatchInlineSnapshot(
        "0.1.0"
      );

      expect(JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json")).version).toEqual(
        "0.1.0"
      );

      expect(await fixture.readWorkspaceFile("CHANGELOG.md")).toMatchInlineSnapshot(`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        # 0.1.0 ({YYYY}-{MM}-{DD})


        ### Features

        * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-single-package/origin/commits/{FULL_COMMIT_SHA}))

      `);

      expect(await fixture.readWorkspaceFile("packages/package-a/CHANGELOG.md")).toMatchInlineSnapshot(`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        # 0.1.0 ({YYYY}-{MM}-{DD})


        ### Features

        * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-single-package/origin/commits/{FULL_COMMIT_SHA}))

      `);
    });
  });

  describe("multiple packages", () => {
    let fixture: Fixture;

    beforeEach(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-version-conventional-commits-multiple-packages",
        packageManager: "npm",
        initializeGit: true,
        runLernaInit: true,
        installDependencies: true,
      });
    });
    afterEach(() => fixture.destroy());

    it("should correctly generate changelog and version information after a `feat` commit", async () => {
      await fixture.createInitialGitCommit();

      await fixture.lerna("create package-a -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-a'");

      await fixture.lerna("create package-b -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-b'");

      await fixture.exec("git push origin test-main");

      const output = await fixture.lerna("version --conventional-commits -y", { silenceError: true });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed
        lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

        Changes:
         - package-a: 0.0.0 => 0.1.0
         - package-b: 0.0.0 => 0.1.0

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

      expect(JSON.parse(await fixture.readWorkspaceFile("lerna.json")).version).toMatchInlineSnapshot(
        "0.1.0"
      );

      expect(JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json")).version).toEqual(
        "0.1.0"
      );

      expect(JSON.parse(await fixture.readWorkspaceFile("packages/package-b/package.json")).version).toEqual(
        "0.1.0"
      );

      expect(await fixture.readWorkspaceFile("CHANGELOG.md")).toMatchInlineSnapshot(`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        # 0.1.0 ({YYYY}-{MM}-{DD})


        ### Features

        * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/origin/commits/{FULL_COMMIT_SHA}))
        * add package-b ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/origin/commits/{FULL_COMMIT_SHA}))

      `);

      expect(await fixture.readWorkspaceFile("packages/package-a/CHANGELOG.md")).toMatchInlineSnapshot(`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        # 0.1.0 ({YYYY}-{MM}-{DD})


        ### Features

        * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/origin/commits/{FULL_COMMIT_SHA}))

      `);

      expect(await fixture.readWorkspaceFile("packages/package-b/CHANGELOG.md")).toMatchInlineSnapshot(`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        # 0.1.0 ({YYYY}-{MM}-{DD})


        ### Features

        * add package-b ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/origin/commits/{FULL_COMMIT_SHA}))

      `);
    });

    it("should correctly generate and promote prereleases when using --conventional-prerelease and --conventional-graduate", async () => {
      await fixture.createInitialGitCommit();

      await fixture.lerna("create package-a -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-a'");

      await fixture.lerna("create package-b -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-b'");

      await fixture.exec("git push origin test-main");

      // Initial versioning with two packages created
      await fixture.lerna("version --conventional-commits -y", { silenceError: true });

      // Update and version just package-a
      await fixture.exec("echo update_package_a > packages/package-a/new_file.txt");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'fix: update package-a'");

      // Create a prerelease version
      const output = await fixture.lerna("version --conventional-commits --conventional-prerelease -y", {
        silenceError: true,
      });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.1.0
        lerna info Looking for changed packages since v0.1.0
        lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

        Changes:
         - package-a: 0.1.0 => 0.1.1-alpha.0

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      // Promote the prerelease version
      const output2 = await fixture.lerna("version --conventional-commits --conventional-graduate -y", {
        silenceError: true,
      });

      expect(output2.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.1.1-alpha.0
        lerna WARN conventional-graduate all packages
        lerna info Graduating all prereleased packages
        lerna info Looking for changed packages since v0.1.1-alpha.0
        lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

        Changes:
         - package-a: 0.1.1-alpha.0 => 0.1.1

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);
    });

    it("should correctly generate and bump prerelease versions when using --conventional-prerelease and --conventional-bump-prerelease", async () => {
      await fixture.createInitialGitCommit();

      await fixture.lerna("create package-a -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-a'");

      await fixture.lerna("create package-b -y");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add package-b'");

      await fixture.exec("git push origin test-main");

      // Initial versioning with two packages created
      await fixture.lerna("version --conventional-commits --conventional-prerelease -y", {
        silenceError: true,
      });

      // Update and version just package-a
      await fixture.exec("echo update_package_a > packages/package-a/new_file.txt");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'fix: update package-a'");

      // Bump a prerelease version
      const output = await fixture.lerna("version --conventional-commits --conventional-bump-prerelease -y", {
        silenceError: true,
      });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.1.0-alpha.0
        lerna info Looking for changed packages since v0.1.0-alpha.0
        lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

        Changes:
         - package-a: 0.1.0-alpha.0 => 0.1.1-alpha.0

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);
    });

    describe("independent packages", () => {
      it("should correctly generate changelog and version information when releasing packages independently", async () => {
        await fixture.createInitialGitCommit();

        fixture.updateJson("lerna.json", (json) => {
          // eslint-disable-next-line no-param-reassign
          json.version = "independent";
          return json;
        });
        await fixture.exec("git add lerna.json");
        await fixture.exec("git commit -m 'chore: set version to independent'");
        await fixture.exec("git push origin test-main");

        await fixture.lerna("create package-a -y");
        await fixture.exec("git add --all");
        await fixture.exec("git commit -m 'feat: add package-a'");

        await fixture.lerna("create package-b -y");
        await fixture.exec("git add --all");
        await fixture.exec("git commit -m 'feat: add package-b'");

        await fixture.exec("git push origin test-main");

        // Initial versioning with two packages created
        const output1 = await fixture.lerna("version --conventional-commits -y", { silenceError: true });

        // NOTE: In the independent case, lerna started with version 1.0.0 as its assumed baseline (not 0.0.0 as in the fixed mode case)
        expect(output1.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info versioning independent
          lerna info Assuming all packages changed
          lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

          Changes:
           - package-a: 1.0.0 => 1.1.0
           - package-b: 1.0.0 => 1.1.0

          lerna info auto-confirmed 
          lerna info execute Skipping releases
          lerna info git Pushing tags...
          lerna success version finished

        `);

        // When releasing independently a root CHANGELOG.md should not be created
        await expect(fixture.readWorkspaceFile("CHANGELOG.md")).rejects.toThrowErrorMatchingInlineSnapshot(
          `ENOENT: no such file or directory, open '/tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/lerna-workspace/CHANGELOG.md'`
        );

        // It should create one tag for each independently versioned package
        const checkPackageTagsArePresentLocally = await fixture.exec("git describe --abbrev=0");
        expect(checkPackageTagsArePresentLocally.combinedOutput).toMatchInlineSnapshot(`
          package-a@1.1.0

        `);

        const checkPackageATagIsPresentOnRemote = await fixture.exec(
          "git ls-remote origin refs/tags/package-a@1.1.0"
        );
        expect(checkPackageATagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
          {FULL_COMMIT_SHA}	refs/tags/package-a@1.1.0

        `);
        const checkPackageBTagIsPresentOnRemote = await fixture.exec(
          "git ls-remote origin refs/tags/package-b@1.1.0"
        );
        expect(checkPackageBTagIsPresentOnRemote.combinedOutput).toMatchInlineSnapshot(`
          {FULL_COMMIT_SHA}	refs/tags/package-b@1.1.0

        `);

        // The lerna.json version field should not be updated with any particular version when in independent mode
        expect(JSON.parse(await fixture.readWorkspaceFile("lerna.json")).version).toMatchInlineSnapshot(
          "independent"
        );

        expect(
          JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json")).version
        ).toEqual("1.1.0");

        expect(
          JSON.parse(await fixture.readWorkspaceFile("packages/package-b/package.json")).version
        ).toEqual("1.1.0");

        expect(await fixture.readWorkspaceFile("packages/package-a/CHANGELOG.md")).toMatchInlineSnapshot(`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          # 1.1.0 ({YYYY}-{MM}-{DD})


          ### Features

          * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/origin/commits/{FULL_COMMIT_SHA}))

        `);

        const cachedPackageBChangelog = await fixture.readWorkspaceFile("packages/package-b/CHANGELOG.md");
        expect(cachedPackageBChangelog).toMatchInlineSnapshot(`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          # 1.1.0 ({YYYY}-{MM}-{DD})


          ### Features

          * add package-b ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/origin/commits/{FULL_COMMIT_SHA}))

        `);

        // Update and version just package-a
        await fixture.exec("echo update_package_a > packages/package-a/new_file.txt");
        await fixture.exec("git add --all");
        await fixture.exec("git commit -m 'fix: update package-a'");

        const output2 = await fixture.lerna("version --conventional-commits -y", { silenceError: true });

        expect(output2.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info versioning independent
          lerna info Looking for changed packages since package-a@1.1.0
          lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

          Changes:
           - package-a: 1.1.0 => 1.1.1

          lerna info auto-confirmed 
          lerna info execute Skipping releases
          lerna info git Pushing tags...
          lerna success version finished

        `);

        expect(await fixture.readWorkspaceFile("packages/package-a/CHANGELOG.md")).toMatchInlineSnapshot(`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          ## [1.1.1](tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/origin/compare/package-a@1.1.0...package-a@1.1.1) ({YYYY}-{MM}-{DD})


          ### Bug Fixes

          * update package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/origin/commits/{FULL_COMMIT_SHA}))





          # 1.1.0 ({YYYY}-{MM}-{DD})


          ### Features

          * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-conventional-commits-multiple-packages/origin/commits/{FULL_COMMIT_SHA}))

        `);

        // package-b CHANGELOG.md should not have been updated
        expect(await fixture.readWorkspaceFile("packages/package-b/CHANGELOG.md")).toEqual(
          cachedPackageBChangelog
        );

        // package-a version should have been updated
        expect(
          JSON.parse(await fixture.readWorkspaceFile("packages/package-a/package.json")).version
        ).toEqual("1.1.1");

        // package-b version should NOT have been updated
        expect(
          JSON.parse(await fixture.readWorkspaceFile("packages/package-b/package.json")).version
        ).toEqual("1.1.0");

        // Only package-a's tag should have been updated
        const checkPackageTagsArePresentLocally2 = await fixture.exec("git describe --abbrev=0");
        expect(checkPackageTagsArePresentLocally2.combinedOutput).toMatchInlineSnapshot(`
          package-a@1.1.1

        `);

        // A 1.1.1 tag for package-a should exist on the remote
        expect((await fixture.exec("git ls-remote origin refs/tags/package-a@1.1.1")).combinedOutput)
          .toMatchInlineSnapshot(`
          {FULL_COMMIT_SHA}	refs/tags/package-a@1.1.1

        `);

        // A 1.1.1 tag for package-b should NOT exist on the remote
        expect(
          (await fixture.exec("git ls-remote origin refs/tags/package-b@1.1.1")).combinedOutput
        ).toMatchInlineSnapshot(``);
      });
    });
  });
});
