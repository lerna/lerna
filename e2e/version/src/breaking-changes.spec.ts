/**
 * These tests capture lerna's default historical behavior around breaking change conventions
 * in conventional commits, per the discussion in https://github.com/lerna/lerna/issues/2668
 */
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

describe("lerna-version-conventional-commits-breaking-changes", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-breaking-changes",
      packageManager: "npm",
      initializeGit: true,
      lernaInit: { args: [`--packages="packages/*"`] },
      installDependencies: true,
    });

    await fixture.createInitialGitCommit();

    // Use independent mode so packages start at 1.0.0, making major bumps clearly visible (2.0.0 vs 1.x)
    fixture.updateJson("lerna.json", (json) => {
      json.version = "independent";
      return json;
    });
    await fixture.exec("git add lerna.json");
    await fixture.exec("git commit -m 'chore: set version to independent'");

    // Create package-a with a feat commit to establish baseline
    await fixture.lerna("create package-a -y");
    await fixture.exec("git add --all");
    await fixture.exec("git commit -m 'feat: add package-a'");

    await fixture.exec("git push origin test-main");

    // Initial versioning to establish 1.1.0 tags
    await fixture.lerna("version --conventional-commits -y", { silenceError: true });
  });

  afterEach(() => fixture.destroy());

  describe("BREAKING CHANGE footer", () => {
    // The BREAKING CHANGE: footer is the standard way to denote breaking changes in conventional commits.
    // The default angular preset correctly detects this via its noteKeywords configuration.
    it("should produce a major version bump when the commit has a BREAKING CHANGE: footer", async () => {
      await fixture.exec("echo update > packages/package-a/new_file.txt");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat: add new API' -m 'BREAKING CHANGE: old API has been removed'");
      await fixture.exec("git push origin test-main");

      const output = await fixture.lerna("version --conventional-commits -y", { silenceError: true });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info versioning independent
        lerna info Looking for changed packages since package-a@1.1.0
        lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

        Changes:
         - package-a: 1.1.0 => 2.0.0

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      const changelog = await fixture.readWorkspaceFile("packages/package-a/CHANGELOG.md");
      expect(changelog).toMatchInlineSnapshot(`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        # [2.0.0](tmp/lerna-e2e/lerna-version-breaking-changes/origin/compare/package-a@1.1.0...package-a@2.0.0) ({YYYY}-{MM}-{DD})


        ### Features

        * add new API ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-breaking-changes/origin/commits/{FULL_COMMIT_SHA}))


        ### BREAKING CHANGES

        * old API has been removed





        # 1.1.0 ({YYYY}-{MM}-{DD})


        ### Features

        * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-breaking-changes/origin/commits/{FULL_COMMIT_SHA}))

      `);
    });
  });

  describe("! notation only", () => {
    // The ! notation (e.g., feat!: description) is part of the Conventional Commits spec for denoting
    // breaking changes. However, the default angular preset's headerPattern regex is:
    //   /^(\w*)(?:\((.*)\))?: (.*)$/
    // This pattern does NOT match "feat!: ..." because the "!" before ":" is not accounted for.
    // As a result, the commit type and subject are both null, and no breaking change is detected.
    // Lerna still bumps the version because it detects file changes, but falls back to a patch bump.
    it("should NOT produce a major version bump because the angular preset does not recognize ! notation", async () => {
      await fixture.exec("echo update > packages/package-a/new_file.txt");
      await fixture.exec("git add --all");
      await fixture.exec("git commit -m 'feat!: drop support for Node 14'");
      await fixture.exec("git push origin test-main");

      const output = await fixture.lerna("version --conventional-commits -y", { silenceError: true });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
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

      const changelog = await fixture.readWorkspaceFile("packages/package-a/CHANGELOG.md");
      // The changelog should NOT contain a BREAKING CHANGES section since the ! was not recognized
      expect(changelog).toMatchInlineSnapshot(`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        ## [1.1.1](tmp/lerna-e2e/lerna-version-breaking-changes/origin/compare/package-a@1.1.0...package-a@1.1.1) ({YYYY}-{MM}-{DD})

        **Note:** Version bump only for package package-a





        # 1.1.0 ({YYYY}-{MM}-{DD})


        ### Features

        * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-breaking-changes/origin/commits/{FULL_COMMIT_SHA}))

      `);
    });
  });

  describe("both ! and BREAKING CHANGE footer", () => {
    // When a commit uses both the ! notation and a BREAKING CHANGE: footer, the header still
    // does not parse due to the ! breaking the angular preset's regex. However, the
    // BREAKING CHANGE: footer IS correctly detected by the angular preset's noteKeywords.
    // This results in a major version bump despite the header not parsing.
    it("should produce a major version bump because the BREAKING CHANGE: footer is still detected", async () => {
      await fixture.exec("echo update > packages/package-a/new_file.txt");
      await fixture.exec("git add --all");
      await fixture.exec(
        "git commit -m 'feat!: rewrite public API' -m 'BREAKING CHANGE: complete rewrite of public API'"
      );
      await fixture.exec("git push origin test-main");

      const output = await fixture.lerna("version --conventional-commits -y", { silenceError: true });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info versioning independent
        lerna info Looking for changed packages since package-a@1.1.0
        lerna info getChangelogConfig Successfully resolved preset "conventional-changelog-angular"

        Changes:
         - package-a: 1.1.0 => 2.0.0

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);

      const changelog = await fixture.readWorkspaceFile("packages/package-a/CHANGELOG.md");
      expect(changelog).toMatchInlineSnapshot(`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        # [2.0.0](tmp/lerna-e2e/lerna-version-breaking-changes/origin/compare/package-a@1.1.0...package-a@2.0.0) ({YYYY}-{MM}-{DD})


        * feat!: rewrite public API ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-breaking-changes/origin/commits/{FULL_COMMIT_SHA}))


        ### BREAKING CHANGES

        * complete rewrite of public API





        # 1.1.0 ({YYYY}-{MM}-{DD})


        ### Features

        * add package-a ([{SHORT_COMMIT_SHA}](tmp/lerna-e2e/lerna-version-breaking-changes/origin/commits/{FULL_COMMIT_SHA}))

      `);
    });
  });
});
