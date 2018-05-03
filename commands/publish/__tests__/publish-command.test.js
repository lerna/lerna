"use strict";

// write-pkg mocked manually
jest.mock("@lerna/prompt");
jest.mock("@lerna/conventional-commits");
jest.mock("@lerna/npm-dist-tag");
jest.mock("@lerna/npm-publish");
jest.mock("@lerna/run-lifecycle");
jest.mock("@lerna/collect-updates");
jest.mock("../lib/git-push");
jest.mock("../lib/is-behind-upstream");

const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");
const semver = require("semver");

// mocked or stubbed modules
const writePkg = require("write-pkg");
const ConventionalCommitUtilities = require("@lerna/conventional-commits");
const Package = require("@lerna/package");
const PromptUtilities = require("@lerna/prompt");
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");
const runLifecycle = require("@lerna/run-lifecycle");
const collectUpdates = require("@lerna/collect-updates");
const gitPush = require("../lib/git-push");
const isBehindUpstream = require("../lib/is-behind-upstream");

// helpers
const consoleOutput = require("@lerna-test/console-output");
const loggingOutput = require("@lerna-test/logging-output");
const gitAdd = require("@lerna-test/git-add");
const gitTag = require("@lerna-test/git-tag");
const gitCommit = require("@lerna-test/git-commit");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const normalizeRelativeDir = require("@lerna-test/normalize-relative-dir");
const showCommit = require("@lerna-test/show-commit");

// file under test
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

const collectUpdatesActual = require.requireActual("@lerna/collect-updates");
// assertion helpers
const gitCommitMessage = cwd =>
  execa("git", ["show", "--no-patch", "--pretty=%B"], { cwd }).then(result => result.stdout.trim());

const listDirty = cwd =>
  execa("git", ["diff", "--name-only"], { cwd }).then(result => result.stdout.split("\n").filter(Boolean));

const publishedTagInDirectories = testDir =>
  npmPublish.mock.calls.reduce((arr, [pkg, tag]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    arr.push({ dir, tag });
    return arr;
  }, []);

const updatedPackageVersions = () => {
  const result = {};

  writePkg.registry.forEach((pkg, name) => {
    result[name] = pkg.version;
  });

  return result;
};

const updatedPackageJSON = name => writePkg.registry.get(name);

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("PublishCommand", () => {
  // we've already tested these utilities elsewhere
  npmPublish.mockResolvedValue();
  runLifecycle.mockImplementation(() => Promise.resolve());
  collectUpdates.mockImplementation(collectUpdatesActual);
  npmDistTag.check.mockReturnValue(true);

  PromptUtilities.select.mockResolvedValue("1.0.1");
  PromptUtilities.confirm.mockResolvedValue(true);

  /** =========================================================================
   * NORMAL
   * ======================================================================= */

  describe("normal mode", () => {
    it("should publish the changed packages", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)();

      expect(PromptUtilities.select.mock.calls).toMatchSnapshot("prompt");
      expect(PromptUtilities.confirm).toBeCalled();

      expect(updatedPackageJSON("package-1")).toMatchSnapshot("gitHead");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");

      expect(gitPush).lastCalledWith(
        "origin",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
      expect(consoleOutput()).toMatchSnapshot("console output");
    });

    it("throws an error when --independent is passed", async () => {
      expect.assertions(1);
      const testDir = await initFixture("normal");
      try {
        await lernaPublish(testDir)("--independent");
      } catch (err) {
        expect(err.message).toMatch("independent");
      }
    });
  });

  /** =========================================================================
   * FIXED
   * ======================================================================= */

  describe("fixed mode", () => {
    it("minor bump should only bump changed", async () => {
      const testDir = await initFixture("normal");
      const package1 = new Package(
        {
          name: "package-1",
          version: "1.0.0",
        },
        `${testDir}/packages/package-1`
      );
      collectUpdates.mockImplementationOnce(() => [{ pkg: package1, localDependencies: [] }]);

      await lernaPublish(testDir)();

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");
    });

    it("major bump should bump all packages", async () => {
      const testDir = await initFixture("normal");
      PromptUtilities.select.mockResolvedValueOnce("2.0.0");
      const package1 = new Package(
        {
          name: "package-1",
          version: "1.0.0",
        },
        `${testDir}/packages/package-1`
      );
      collectUpdates.mockImplementationOnce(() => [{ pkg: package1, localDependencies: [] }]);

      await lernaPublish(testDir)();

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");
    });
  });

  /** =========================================================================
   * INDEPENDENT
   * ======================================================================= */

  describe("independent mode", () => {
    it("should publish the changed packages in independent mode", async () => {
      // mock version prompt choices
      ["1.0.1", "1.1.0", "2.0.0", "1.1.0", "1.0.1"].forEach(chosenVersion =>
        PromptUtilities.select.mockResolvedValueOnce(chosenVersion)
      );

      const testDir = await initFixture("independent");
      await lernaPublish(testDir)(); // --independent is only valid in InitCommand

      expect(PromptUtilities.confirm).toBeCalled();

      expect(updatedPackageJSON("package-1")).toMatchSnapshot("gitHead");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");

      expect(gitPush).lastCalledWith(
        "origin",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
      expect(consoleOutput()).toMatchSnapshot("console output");
    });
  });

  /** =========================================================================
   * NORMAL - CANARY
   * ======================================================================= */

  describe("normal mode as canary", () => {
    it("should publish the changed packages", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--canary");

      expect(PromptUtilities.select).not.toBeCalled();

      expect(writePkg.registry).toMatchSnapshot("updated packages");

      const unstaged = await listDirty(testDir);
      expect(unstaged).toEqual([]);

      expect(gitPush).not.toBeCalled();
      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });

    it("should use the provided value as the meta suffix", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--canary", "beta");

      expect(writePkg.registry).toMatchSnapshot("updated packages");
    });

    it("should work with --canary and --cd-version=patch", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--canary", "--cd-version", "patch");

      expect(writePkg.registry).toMatchSnapshot("updated packages");
    });
  });

  /** =========================================================================
   * INDEPENDENT - CANARY
   * ======================================================================= */

  describe("independent mode as canary", () => {
    it("should publish the changed packages", async () => {
      const testDir = await initFixture("independent");
      await lernaPublish(testDir)("--canary");

      expect(PromptUtilities.select).not.toBeCalled();

      expect(writePkg.registry).toMatchSnapshot("updated packages");

      const unstaged = await listDirty(testDir);
      expect(unstaged).toEqual([]);

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });

    it("should use the provided value as the meta suffix", async () => {
      const testDir = await initFixture("independent");
      await lernaPublish(testDir)("--canary", "beta");

      expect(writePkg.registry).toMatchSnapshot("updated packages");
    });
  });

  /** =========================================================================
   * NORMAL - SKIP GIT
   * ======================================================================= */

  describe("normal mode with --skip-git", () => {
    it("should publish the changed packages", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--skip-git");

      expect(updatedPackageJSON("package-1")).toMatchSnapshot("gitHead");
      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");

      const unstaged = await listDirty(testDir);
      // FIXME: lerna.json should not have unstaged changes
      expect(unstaged).toEqual(["lerna.json"]);
    });

    it("should display a message that git is skipped", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--skip-git");

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("Skipping git commit/push");
    });
  });

  /** =========================================================================
   * NORMAL - SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-npm", () => {
    it("should update versions and push changes but not publish", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--skip-npm");

      expect(npmPublish).not.toBeCalled();
      expect(updatedPackageJSON("package-1")).toEqual({
        name: "package-1",
        version: "1.0.1",
        // gitHead not annotated
      });

      expect(gitPush).lastCalledWith(
        "origin",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
    });

    it("should display a message that npm is skipped", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--skip-npm");

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("Skipping publish to registry");
    });
  });

  /** =========================================================================
   * NORMAL - SKIP GIT AND SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-git and --skip-npm", () => {
    it("should update versions but not push changes or publish", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--skip-git", "--skip-npm");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.0.1",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^1.0.1",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-1": "^1.0.1",
      });

      expect(gitPush).not.toBeCalled();

      const unstaged = await listDirty(testDir);
      expect(unstaged).not.toEqual([]);

      expect(npmPublish).not.toBeCalled();
      expect(npmDistTag.check).not.toBeCalled();
      expect(npmDistTag.remove).not.toBeCalled();
      expect(npmDistTag.add).not.toBeCalled();
    });

    it("should display a message that npm and git are skipped", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--skip-git", "--skip-npm");

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("Skipping git commit/push");
      expect(logMessages).toContain("Skipping publish to registry");
    });
  });

  /** =========================================================================
   * NORMAL - TEMP TAG
   * ======================================================================= */

  describe("normal mode with --temp-tag", () => {
    const removedDistTagInDirectories = testDir =>
      npmDistTag.remove.mock.calls.reduce((obj, [pkg, tag]) => {
        const location = normalizeRelativeDir(testDir, pkg.location);
        obj[location] = tag;
        return obj;
      }, {});

    const addedDistTagInDirectories = testDir =>
      npmDistTag.add.mock.calls.reduce((obj, [pkg, version, tag]) => {
        const location = normalizeRelativeDir(testDir, pkg.location);
        obj[location] = `${pkg.name}@${version} ${tag}`;
        return obj;
      }, {});

    it("should publish the changed packages with a temp tag", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--temp-tag");

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
      expect(removedDistTagInDirectories(testDir)).toMatchSnapshot("npm dist-tag rm");
      expect(addedDistTagInDirectories(testDir)).toMatchSnapshot("npm dist-tag add");

      expect(gitPush).lastCalledWith(
        "origin",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
    });
  });

  /** =========================================================================
   * NORMAL - NPM TAG
   * ======================================================================= */

  describe("normal mode with --npm-tag", () => {
    it("should publish the changed packages with npm tag", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--npm-tag", "custom");

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });
  });

  /** =========================================================================
   * AUTO-ACCEPT
   * ======================================================================= */

  describe("with --yes", () => {
    it("skips confirmation prompt", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--yes", "--repo-version", "1.0.1-auto-confirm");

      expect(PromptUtilities.select).not.toBeCalled();
      expect(PromptUtilities.confirm).not.toBeCalled();

      const message = await gitCommitMessage(testDir);
      expect(message).toBe("v1.0.1-auto-confirm");
    });
  });

  /** =========================================================================
   * NORMAL - REGISTRY
   * ======================================================================= */

  describe("normal mode with --registry", () => {
    it("passes registry to npm commands", async () => {
      const testDir = await initFixture("normal");
      const registry = "https://my-private-registry";

      await lernaPublish(testDir)("--registry", registry);

      expect(npmDistTag.check).not.toBeCalled();
      expect(npmDistTag.remove).not.toBeCalled();
      expect(npmDistTag.add).not.toBeCalled();
      // FIXME: this isn't actually asserting anything about --registry
      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });
  });

  /** =========================================================================
   * NORMAL - REPO VERSION
   * ======================================================================= */

  describe("normal mode with --repo-version", () => {
    it("skips version prompt and publishes changed packages with designated version", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--repo-version", "1.0.1-beta.25");

      expect(PromptUtilities.select).not.toBeCalled();

      const message = await gitCommitMessage(testDir);
      expect(message).toBe("v1.0.1-beta.25");
    });
  });

  /** =========================================================================
   * NORMAL - EXACT
   * ======================================================================= */

  describe("normal mode with --exact", () => {
    it("updates matching local dependencies of published packages with exact versions", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--exact");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");
    });

    it("updates existing exact versions", async () => {
      const testDir = await initFixture("normal-exact");
      await lernaPublish(testDir)();

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");
    });
  });

  /** =========================================================================
   * NORMAL MODE - CD VERSION
   * ======================================================================= */

  describe("normal mode with --cd-version", () => {
    it("should use semver increments when passed to cdVersion flag", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--cd-version", "minor");

      expect(PromptUtilities.select).not.toBeCalled();

      const message = await gitCommitMessage(testDir);
      expect(message).toBe("v1.1.0");
    });

    it("throws an error when an invalid semver keyword is used", async () => {
      expect.assertions(1);

      const testDir = await initFixture("normal");
      try {
        await lernaPublish(testDir)("--cd-version", "poopypants");
      } catch (err) {
        expect(err.message).toBe(
          "--cd-version must be one of: " +
            "'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'."
        );
      }
    });
  });

  /** =========================================================================
   * CD VERSION - REPUBLISH PRERELEASED
   * ======================================================================= */

  describe("normal mode with previous prerelease", () => {
    const setupChanges = async cwd => {
      await gitTag(cwd, "v1.0.0-beta.3");
      await fs.outputFile(path.join(cwd, "packages/package-3/hello.js"), "world");
      await gitAdd(cwd, ".");
      await gitCommit(cwd, "setup");
    };

    it("publishes changed & prereleased packages if --cd-version is non-prerelease", async () => {
      const testDir = await initFixture("republish-prereleased");
      // should republish 3, 4, and 5 because:
      // package 3 changed
      // package 5 has a prerelease version
      // package 4 depends on package 5
      await setupChanges(testDir);
      await lernaPublish(testDir)("--cd-version", "patch");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");
    });

    it("should not publish prereleased packages if --cd-version is a pre-* increment", async () => {
      const testDir = await initFixture("republish-prereleased");
      // should republish only package 3, because only it changed
      await setupChanges(testDir);
      await lernaPublish(testDir)("--cd-version", "prerelease", "---preid", "beta");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");
    });
  });

  /** =========================================================================
   * INDEPENDENT - CD VERSION
   * ======================================================================= */

  describe("indepdendent mode with --cd-version", () => {
    it("should use semver increments when passed to cdVersion flag", async () => {
      const testDir = await initFixture("independent");
      await lernaPublish(testDir)("--cd-version", "patch");

      expect(PromptUtilities.select).not.toBeCalled();

      const message = await gitCommitMessage(testDir);
      expect(message).toMatchSnapshot();
    });

    /** =========================================================================
     * INDEPENDENT - CD VERSION - PRERELEASE
     * ======================================================================= */

    it("should bump to prerelease versions with --cd-version=prerelease --preid=foo", async () => {
      const testDir = await initFixture("independent");
      await lernaPublish(testDir)("--cd-version", "prerelease", "--preid", "foo");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");
    });

    it("should bump to prerelease versions with --cd-version prerelease (no --preid)", async () => {
      const testDir = await initFixture("independent");
      await lernaPublish(testDir)("--cd-version", "prerelease");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");
    });
  });

  /** =========================================================================
   * NORMAL - GIT REMOTE
   * ======================================================================= */

  describe("normal mode with --git-remote", () => {
    it("pushes tags to specified remote", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--git-remote", "upstream");

      expect(gitPush).lastCalledWith(
        "upstream",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
    });
  });

  /** =========================================================================
   * NORMAL - IGNORE CHANGES
   * ======================================================================= */

  describe("normal mode with --ignore-changes", () => {
    const setupChanges = async (cwd, files) => {
      await gitTag(cwd, "v1.0.0");
      await Promise.all(
        files.map(([filePath, content]) => fs.outputFile(path.join(cwd, filePath), content, "utf8"))
      );
      await gitAdd(cwd, ".");
      await gitCommit(cwd, "setup");
    };

    it("does not publish packages with ignored changes", async () => {
      const testDir = await initFixture("normal");

      await setupChanges(testDir, [
        ["packages/package-2/README.md", "oh"],
        ["packages/package-3/__tests__/pkg3.test.js", "hai"],
        ["packages/package-4/lib/foo.js", "there"],
      ]);

      await lernaPublish(testDir)(
        "--ignore-changes",
        "README.md",

        "--ignore-changes",
        "**/__tests__/**",

        "--ignore-changes",
        "package-4" // notably does NOT work, needs to be "**/package-4/**" to match
      );

      const changedFiles = await showCommit(testDir, "--name-only");
      expect(changedFiles).toMatchSnapshot();
    });

    it("maps deprecated --ignore", async () => {
      const testDir = await initFixture("normal");

      await setupChanges(testDir, [
        ["packages/package-3/README.md", "wat"],
        ["packages/package-4/lib/foo.js", "hey"],
      ]);

      await lernaPublish(testDir)("--ignore", "*.md");

      const changedFiles = await showCommit(testDir, "--name-only");
      expect(changedFiles).toMatchSnapshot();
    });
  });

  /** =========================================================================
   * NORMAL - MESSAGE
   * ======================================================================= */

  describe("normal mode with --message", () => {
    it("commits changes with a custom message using %s", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--message", "chore: Release %s :rocket:");

      const message = await gitCommitMessage(testDir);
      expect(message).toMatch("Release v1.0.1");
    });

    it("commits changes with a custom message using %v", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--message", "chore: Release %v :rocket:");

      const message = await gitCommitMessage(testDir);
      expect(message).toMatch("Release 1.0.1");
    });
  });

  /** =========================================================================
   * INDEPENDENT - MESSAGE
   * ======================================================================= */

  describe("independent mode with --message", () => {
    it("commits changes with a custom message", async () => {
      const testDir = await initFixture("independent");
      await lernaPublish(testDir)("-m", "chore: Custom publish message");

      const message = await gitCommitMessage(testDir);
      expect(message).toMatch("chore: Custom publish message");
    });
  });

  /** =========================================================================
   * CONVENTIONAL COMMITS
   * ======================================================================= */

  describe("--conventional-commits", () => {
    ConventionalCommitUtilities.updateChangelog.mockImplementation(pkg => {
      const filePath = path.join(pkg.location, "CHANGELOG.md");

      // grumble grumble re-implementing the implementation
      return fs.outputFile(filePath, "changelog", "utf8").then(() => filePath);
    });

    describe("independent mode", () => {
      const versionBumps = ["1.0.1", "2.1.0", "4.0.0", "4.1.0", "5.0.1"];

      beforeEach(() => {
        versionBumps.forEach(bump =>
          ConventionalCommitUtilities.recommendVersion.mockResolvedValueOnce(bump)
        );
      });

      it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
        const testDir = await initFixture("independent");

        await lernaPublish(testDir)("--conventional-commits");

        const changedFiles = await showCommit(testDir, "--name-only");
        expect(changedFiles).toMatchSnapshot();

        ["package-1", "package-2", "package-3", "package-4", "package-5"].forEach((name, idx) => {
          expect(ConventionalCommitUtilities.recommendVersion).toBeCalledWith(
            expect.objectContaining({ name }),
            "independent",
            { changelogPreset: undefined, rootPath: testDir }
          );
          expect(ConventionalCommitUtilities.updateChangelog).toBeCalledWith(
            expect.objectContaining({ name, version: versionBumps[idx] }),
            "independent",
            { changelogPreset: undefined, rootPath: testDir }
          );
        });
      });

      it("accepts --changelog-preset option", async () => {
        const testDir = await initFixture("independent");
        const changelogOpts = { changelogPreset: "foo-bar", rootPath: testDir };

        await lernaPublish(testDir)("--conventional-commits", "--changelog-preset", "foo-bar");

        expect(ConventionalCommitUtilities.recommendVersion).toBeCalledWith(
          expect.any(Object),
          "independent",
          changelogOpts
        );
        expect(ConventionalCommitUtilities.updateChangelog).toBeCalledWith(
          expect.any(Object),
          "independent",
          changelogOpts
        );
      });
    });

    describe("fixed mode", () => {
      beforeEach(() => {
        ConventionalCommitUtilities.recommendVersion
          .mockResolvedValueOnce("1.0.1")
          .mockResolvedValueOnce("1.1.0")
          .mockResolvedValueOnce("2.0.0")
          .mockResolvedValueOnce("1.1.0")
          .mockResolvedValueOnce("1.0.0");
      });

      it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
        const testDir = await initFixture("normal");

        await lernaPublish(testDir)("--conventional-commits");

        const changedFiles = await showCommit(testDir, "--name-only");
        expect(changedFiles).toMatchSnapshot();

        ["package-1", "package-2", "package-3", "package-4", "package-5"].forEach(name => {
          const location = path.join(testDir, "packages", name);

          expect(ConventionalCommitUtilities.recommendVersion).toBeCalledWith(
            expect.objectContaining({ name, location }),
            "fixed",
            { changelogPreset: undefined, rootPath: testDir }
          );

          expect(ConventionalCommitUtilities.updateChangelog).toBeCalledWith(
            expect.objectContaining({ name, version: "2.0.0" }),
            "fixed",
            { changelogPreset: undefined, rootPath: testDir }
          );
        });

        expect(ConventionalCommitUtilities.updateChangelog).lastCalledWith(
          expect.objectContaining({
            name: "normal",
            location: testDir,
          }),
          "root",
          { changelogPreset: undefined, rootPath: testDir, version: "2.0.0" }
        );
      });

      it("accepts --changelog-preset option", async () => {
        const testDir = await initFixture("normal");
        const changelogOpts = { changelogPreset: "baz-qux", rootPath: testDir };

        await lernaPublish(testDir)("--conventional-commits", "--changelog-preset", "baz-qux");

        expect(ConventionalCommitUtilities.recommendVersion).toBeCalledWith(
          expect.any(Object),
          "fixed",
          changelogOpts
        );
        expect(ConventionalCommitUtilities.updateChangelog).toBeCalledWith(
          expect.any(Object),
          "fixed",
          changelogOpts
        );
      });
    });

    it("avoids duplicating previously-released version", async () => {
      const testDir = await initFixture("normal-no-inter-dependencies");

      await gitTag(testDir, "v1.0.0");
      await fs.outputFile(path.join(testDir, "packages/package-1/index.js"), "one");
      await gitAdd(testDir, ".");
      await gitCommit(testDir, "feat(package-1): add thing");

      // feat(package-1): add thing
      ConventionalCommitUtilities.recommendVersion.mockResolvedValueOnce("1.1.0");

      await lernaPublish(testDir)("--conventional-commits");

      expect(updatedPackageVersions(testDir)).toEqual({
        "package-1": "1.1.0",
      });

      // clear previous publish mock records
      jest.clearAllMocks();
      writePkg.registry.clear();

      await fs.outputFile(path.join(testDir, "packages/package-2/index.js"), "two");
      await gitAdd(testDir, ".");
      await gitCommit(testDir, "fix(package-2): oops thing");

      // fix(package-2): oops thing
      ConventionalCommitUtilities.recommendVersion.mockImplementationOnce(pkg =>
        Promise.resolve(semver.inc(pkg.version, "patch"))
      );

      await lernaPublish(testDir)("--conventional-commits", "--yes");

      expect(updatedPackageVersions(testDir)).toEqual({
        "package-2": "1.1.1",
      });
    });
  });

  /** =========================================================================
   * INDEPENDENT - CANARY + NPMTAG + YES + EXACT
   * ======================================================================= */

  describe("independent mode --canary --npm-tag=next --yes --exact", () => {
    it("should publish the changed packages", async () => {
      const testDir = await initFixture("independent");
      await lernaPublish(testDir)("--canary", "--npm-tag", "next", "--yes", "--exact");

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });
  });

  describe("--allow-branch", () => {
    const changeBranch = (cwd, name) => execa("git", ["checkout", "-B", name], { cwd });

    describe("cli", () => {
      it("should reject a non matching branch", async () => {
        const testDir = await initFixture("normal");

        try {
          await changeBranch(testDir, "unmatched");
          await lernaPublish(testDir)("--allow-branch", "master");
        } catch (err) {
          expect(err.message).toMatch("Branch 'unmatched' is restricted from publishing");
        }
      });

      it("should accept an exactly matching branch", async () => {
        const testDir = await initFixture("normal");

        await changeBranch(testDir, "exact-match");
        await lernaPublish(testDir)("--allow-branch", "exact-match");

        expect(publishedTagInDirectories(testDir)).toHaveLength(4);
      });

      it("should accept a branch that matches by wildcard", async () => {
        const testDir = await initFixture("normal");

        await changeBranch(testDir, "feature/awesome");
        await lernaPublish(testDir)("--allow-branch", "feature/*");

        expect(publishedTagInDirectories(testDir)).toHaveLength(4);
      });

      it("should accept a branch that matches one of the items passed", async () => {
        const testDir = await initFixture("normal");

        await changeBranch(testDir, "feature/awesome");
        await lernaPublish(testDir)("--allow-branch", "master", "feature/*");

        expect(publishedTagInDirectories(testDir)).toHaveLength(4);
      });
    });

    describe("lerna.json", () => {
      it("should reject a non matching branch", async () => {
        const testDir = await initFixture("allow-branch-lerna");

        try {
          await changeBranch(testDir, "unmatched");
          await lernaPublish(testDir)();
        } catch (err) {
          expect(err.message).toMatch("Branch 'unmatched' is restricted from publishing");
        }
      });

      it("should accept a matching branch", async () => {
        const testDir = await initFixture("allow-branch-lerna");

        await changeBranch(testDir, "lerna");
        await lernaPublish(testDir)();

        expect(publishedTagInDirectories(testDir)).toHaveLength(1);
      });

      it("should prioritize cli over defaults", async () => {
        const testDir = await initFixture("allow-branch-lerna");

        await changeBranch(testDir, "cli-override");
        await lernaPublish(testDir)("--allow-branch", "cli-override");

        expect(publishedTagInDirectories(testDir)).toHaveLength(1);
      });
    });

    describe("with --canary", () => {
      it("does not restrict publishing canary versions", async () => {
        const testDir = await initFixture("normal");

        await changeBranch(testDir, "other");
        await lernaPublish(testDir)("--allow-branch", "master", "--canary");

        expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");
      });
    });
  });

  describe("when local clone is behind upstream", () => {
    it("throws an error during interactive publish", async () => {
      const testDir = await initFixture("normal");

      isBehindUpstream.mockReturnValueOnce(true);

      try {
        await lernaPublish(testDir)();
      } catch (err) {
        expect(err.message).toMatch("behind remote upstream");
        expect(err.message).toMatch("Please merge remote changes");
      }
    });

    it("logs a warning and exits early during CI publish", async () => {
      const testDir = await initFixture("normal");

      isBehindUpstream.mockReturnValueOnce(true);

      await lernaPublish(testDir)("--ci");

      const [warning] = loggingOutput("warn");
      expect(warning).toMatch("behind remote upstream");
      expect(warning).toMatch("exiting");
    });
  });

  /** =========================================================================
   * VERSION LIFECYCLE SCRIPTS
   * ======================================================================= */

  describe("lifecycle scripts", () => {
    it("calls version and publish lifecycle scripts for root and packages", async () => {
      const testDir = await initFixture("lifecycle");
      await lernaPublish(testDir)();

      expect(runLifecycle).toHaveBeenCalledTimes(12);

      ["preversion", "version", "postversion"].forEach(script => {
        expect(runLifecycle).toHaveBeenCalledWith(
          expect.objectContaining({ name: "lifecycle" }),
          script,
          expect.any(Object) // conf
        );
        expect(runLifecycle).toHaveBeenCalledWith(
          expect.objectContaining({ name: "package-1" }),
          script,
          expect.any(Object) // conf
        );
      });

      // package-2 lacks version lifecycle scripts
      expect(runLifecycle).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-2" }),
        expect.any(String),
        expect.any(Object) // conf
      );

      expect(runLifecycle.mock.calls.map(([pkg, script]) => [pkg.name, script])).toEqual([
        ["lifecycle", "preversion"],
        ["package-1", "preversion"],
        ["package-1", "version"],
        ["lifecycle", "version"],
        ["package-1", "postversion"],
        ["lifecycle", "postversion"],
        ["lifecycle", "prepare"],
        ["lifecycle", "prepublishOnly"],
        ["package-1", "prepare"],
        ["package-1", "prepublishOnly"],
        ["package-1", "postpublish"],
        ["lifecycle", "postpublish"],
      ]);
    });

    it("logs lifecycle errors but preserves chain", async () => {
      const testDir = await initFixture("lifecycle");

      runLifecycle.mockImplementationOnce(() => Promise.reject(new Error("boom")));

      await lernaPublish(testDir)();

      expect(runLifecycle).toHaveBeenCalledTimes(12);
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      const [errorLog] = loggingOutput("error");
      expect(errorLog).toMatch("error running preversion in lifecycle");
    });

    it("adapts to missing root package name", async () => {
      const testDir = await initFixture("lifecycle-no-root-name");

      await lernaPublish(testDir)();

      expect(runLifecycle).toHaveBeenCalledTimes(6);

      ["preversion", "version", "postversion"].forEach(script => {
        expect(runLifecycle).toHaveBeenCalledWith(
          expect.objectContaining({
            // defaulted from dirname, like npm init
            name: path.basename(testDir),
          }),
          script,
          expect.any(Object) // conf
        );
      });
    });
  });

  it("exits with an error when git HEAD is detached", async () => {
    const cwd = await initFixture("normal-no-inter-dependencies");

    try {
      const sha = await execa.stdout("git", ["rev-parse", "HEAD"], { cwd });
      await execa("git", ["checkout", sha], { cwd }); // detach head

      await lernaPublish(cwd)();
    } catch (err) {
      expect(err.prefix).toBe("ENOGIT");
      expect(err.message).toBe("Detached git HEAD, please checkout a branch to publish changes.");
    }
  });

  it("publishes all transitive dependents after change", async () => {
    const testDir = await initFixture("snake-graph");

    await gitTag(testDir, "v1.0.0");
    await fs.outputFile(path.join(testDir, "packages/package-1/hello.js"), "world");
    await gitAdd(testDir, ".");
    await gitCommit(testDir, "feat: hello");

    await lernaPublish(testDir)("--cd-version", "major", "--yes");

    expect(showCommit(testDir)).toMatchSnapshot("commit");
  });

  describe("with git-hosted sibling dependencies", () => {
    it("updates gitCommittish versions as sshurls", async () => {
      const testDir = await initFixture("git-hosted-sibling-committish");

      await lernaPublish(testDir)("--cd-version", "minor");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot();

      // package-1 doesn't have any dependencies
      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "git+ssh://git@github.com/user/package-1.git#v1.1.0",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "git+ssh://git@github.com/user/package-2.git#v1.1.0",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "github:user/package-1#v0.0.0", // non-matching semver
      });
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-1": "git+ssh://git@github.com/user/package-1.git#v1.1.0",
      });
    });

    it("updates gitRange versions as sshurls", async () => {
      const testDir = await initFixture("git-hosted-sibling-semver");

      await lernaPublish(testDir)("--cd-version", "prerelease", "--preid", "beta");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot();

      // package-1 doesn't have any dependencies
      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "git+ssh://git@github.com/user/package-1.git#semver:^1.0.1-beta.0",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "git+ssh://git@github.com/user/package-2.git#semver:^1.0.1-beta.0",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "github:user/package-1#semver:^0.1.0", // non-matching semver
      });
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-1": "git+ssh://git@github.com/user/package-1.git#semver:^1.0.1-beta.0",
      });
    });
  });

  describe("with relative file: specifiers", () => {
    const setupChanges = async (cwd, pkgRoot = "packages") => {
      await gitTag(cwd, "v1.0.0");
      await fs.outputFile(path.join(cwd, `${pkgRoot}/package-1/hello.js`), "world");
      await gitAdd(cwd, ".");
      await gitCommit(cwd, "setup");
    };

    it("overwrites relative link with local version before npm publish but after git commit", async () => {
      const testDir = await initFixture("relative-file-specs");

      await setupChanges(testDir);
      await lernaPublish(testDir)("--cd-version", "major", "--yes");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot();

      // notably missing is package-1, which has no relative file: dependencies
      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^2.0.0",
      });
      expect(updatedPackageJSON("package-3").dependencies).toMatchObject({
        "package-2": "^2.0.0",
      });
      expect(updatedPackageJSON("package-4").optionalDependencies).toMatchObject({
        "package-3": "^2.0.0",
      });
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-4": "^2.0.0",
        // FIXME: awkward... (_intentional_, for now)
        "package-6": "^2.0.0",
      });
      // private packages do not need local version resolution
      expect(updatedPackageJSON("package-7").dependencies).toMatchObject({
        "package-1": "file:../package-1",
      });
    });

    it("falls back to existing relative version when it is not updated", async () => {
      const testDir = await initFixture("relative-independent");

      await setupChanges(testDir);
      await lernaPublish(testDir)("--cd-version", "minor", "--yes");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot();

      // package-4 was updated, but package-6 was not
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-4": "^4.1.0",
        "package-6": "^6.0.0",
      });
    });

    it("respects --exact", async () => {
      const testDir = await initFixture("relative-independent");

      await setupChanges(testDir);
      await lernaPublish(testDir)("--cd-version", "patch", "--yes", "--exact");

      // package-4 was updated, but package-6 was not
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-4": "4.0.1",
        "package-6": "6.0.0",
      });
    });

    it("works around npm-incompatible link: specifiers", async () => {
      const testDir = await initFixture("yarn-link-spec");

      await setupChanges(testDir, "workspaces");
      await lernaPublish(testDir)("--cd-version", "major", "--yes");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^2.0.0",
      });
    });
  });

  describe("in a cyclical repo", () => {
    it("should throw an error with --reject-cycles", async () => {
      expect.assertions(1);

      try {
        const testDir = await initFixture("toposort");

        await lernaPublish(testDir)("--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });
});
