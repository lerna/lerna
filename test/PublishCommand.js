"use strict";

jest.mock("write-json-file");
jest.mock("write-pkg");
jest.mock("../src/GitUtilities");
jest.mock("../src/PromptUtilities");
jest.mock("../src/ConventionalCommitUtilities");
jest.mock("../src/utils/npm-dist-tag");
jest.mock("../src/utils/npm-publish");
jest.mock("../src/utils/npm-run-script");

const fs = require("fs-extra");
const normalizeNewline = require("normalize-newline");
const path = require("path");
const semver = require("semver");

// mocked or stubbed modules
const writeJsonFile = require("write-json-file");
const writePkg = require("write-pkg");
const ConventionalCommitUtilities = require("../src/ConventionalCommitUtilities");
const GitUtilities = require("../src/GitUtilities");
const PromptUtilities = require("../src/PromptUtilities");
const npmDistTag = require("../src/utils/npm-dist-tag");
const npmPublish = require("../src/utils/npm-publish");
const npmRunScript = require("../src/utils/npm-run-script");

// helpers
const consoleOutput = require("./helpers/consoleOutput");
const initFixture = require("./helpers/initFixture");
const normalizeRelativeDir = require("./helpers/normalizeRelativeDir");

// file under test
const lernaPublish = require("./helpers/command-runner")(require("../src/commands/PublishCommand"));

// assertion helpers
const publishedTagInDirectories = testDir =>
  npmPublish.mock.calls.reduce((arr, args) => {
    const tag = args[0];
    const dir = normalizeRelativeDir(testDir, args[1].location);
    arr.push({ dir, tag });
    return arr;
  }, []);

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

const gitAddedFiles = testDir =>
  GitUtilities.addFiles.mock.calls.reduce(
    (arr, [files]) => arr.concat(files.map(fp => normalizeRelativeDir(testDir, fp))),
    []
  );

const gitCommitMessage = () => normalizeNewline(GitUtilities.commit.mock.calls[0][0]);

const gitTagsAdded = () => GitUtilities.addTag.mock.calls.map(args => args[0]);

const updatedLernaJson = () => writeJsonFile.mock.calls[0][1];

const updatedPackageVersions = testDir =>
  writePkg.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, path.dirname(args[0]));
    obj[location] = args[1].version;
    return obj;
  }, {});

const updatedPackageJSON = name =>
  writePkg.mock.calls
    .reduce((arr, args) => {
      if (args[1].name === name) {
        arr.push(args[1]);
      }
      return arr;
    }, [])
    .pop();

describe("PublishCommand", () => {
  // default exports that return Promises
  writePkg.mockResolvedValue();
  writeJsonFile.mockResolvedValue();

  // we've already tested these utilities elsewhere
  GitUtilities.isInitialized.mockReturnValue(true);
  GitUtilities.getCurrentBranch.mockReturnValue("master");
  GitUtilities.getShortSHA.mockReturnValue("deadbeef");
  GitUtilities.diffSinceIn.mockReturnValue("");

  npmPublish.mockResolvedValue();
  npmRunScript.mockResolvedValue();
  npmDistTag.check.mockReturnValue(true);

  PromptUtilities.select.mockResolvedValue("1.0.1");
  PromptUtilities.confirm.mockResolvedValue(true);

  /** =========================================================================
   * NORMAL
   * ======================================================================= */

  describe("normal mode", () => {
    it("should publish the changed packages", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)();

      expect(PromptUtilities.select.mock.calls).toMatchSnapshot("prompt");
      expect(PromptUtilities.confirm).toBeCalled();

      expect(updatedLernaJson()).toMatchObject({ version: "1.0.1" });
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.0.1",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^1.0.1",
      });
      // peerDependencies are _never_ modified automatically
      expect(updatedPackageJSON("package-3").peerDependencies).toMatchObject({
        "package-2": "^1.0.0",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-1": "^1.0.1",
      });

      expect(gitAddedFiles(testDir)).toMatchSnapshot("git added files");
      expect(gitCommitMessage()).toEqual("v1.0.1");
      expect(gitTagsAdded()).toEqual(["v1.0.1"]);

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");

      expect(GitUtilities.pushWithTags).lastCalledWith(
        "origin",
        gitTagsAdded(),
        expect.objectContaining({
          cwd: testDir,
        })
      );
      expect(consoleOutput()).toMatchSnapshot("console output");
    });

    it("throws an error when --independent is passed", async () => {
      expect.assertions(1);
      const testDir = await initFixture("PublishCommand/normal");
      try {
        await lernaPublish(testDir)("--independent");
      } catch (err) {
        expect(err.message).toMatch("independent");
      }
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

      const testDir = await initFixture("PublishCommand/independent");
      await lernaPublish(testDir)(); // --independent is only valid in InitCommand

      expect(PromptUtilities.confirm).toBeCalled();
      expect(writeJsonFile).not.toBeCalled();

      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.0.1",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^1.1.0",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-3": "^2.0.0",
      });

      expect(gitAddedFiles(testDir)).toMatchSnapshot("git added files");
      expect(gitCommitMessage()).toMatchSnapshot("git commit message");
      expect(gitTagsAdded()).toMatchSnapshot("git tags added");
      expect(GitUtilities.checkoutChanges).not.toBeCalled();

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");

      expect(GitUtilities.pushWithTags).lastCalledWith(
        "origin",
        gitTagsAdded(),
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
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--canary");

      expect(PromptUtilities.select).not.toBeCalled();

      expect(writeJsonFile).not.toBeCalled();
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.1.0-alpha.deadbeef",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^1.1.0-alpha.deadbeef",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });

      expect(GitUtilities.addFiles).not.toBeCalled();
      expect(GitUtilities.commit).not.toBeCalled();
      expect(GitUtilities.addTag).not.toBeCalled();
      expect(GitUtilities.checkoutChanges).lastCalledWith(
        expect.stringContaining("packages/*/package.json"),
        expect.objectContaining({
          cwd: testDir,
        })
      );

      expect(GitUtilities.pushWithTags).not.toBeCalled();
      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });

    it("should use the provided value as the meta suffix", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--canary", "beta");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.1.0-beta.deadbeef",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^1.1.0-beta.deadbeef",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });
    });

    it("should work with --canary and --cd-version=patch", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--canary", "--cd-version", "patch");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.0.1-alpha.deadbeef",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^1.0.1-alpha.deadbeef",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });
    });
  });

  /** =========================================================================
   * INDEPENDENT - CANARY
   * ======================================================================= */

  describe("independent mode as canary", () => {
    it("should publish the changed packages", async () => {
      const testDir = await initFixture("PublishCommand/independent");
      await lernaPublish(testDir)("--canary");

      expect(PromptUtilities.select).not.toBeCalled();

      expect(writeJsonFile).not.toBeCalled();
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.1.0-alpha.deadbeef",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^2.1.0-alpha.deadbeef",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });

    it("should use the provided value as the meta suffix", async () => {
      const testDir = await initFixture("PublishCommand/independent");
      await lernaPublish(testDir)("--canary", "beta");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.1.0-beta.deadbeef",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^2.1.0-beta.deadbeef",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });
    });
  });

  /** =========================================================================
   * NORMAL - SKIP GIT
   * ======================================================================= */

  describe("normal mode with --skip-git", () => {
    it("should publish the changed packages", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--skip-git");

      expect(GitUtilities.addFiles).not.toBeCalled();
      expect(GitUtilities.commit).not.toBeCalled();
      expect(GitUtilities.addTag).not.toBeCalled();
      expect(GitUtilities.pushWithTags).not.toBeCalled();

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });
  });

  /** =========================================================================
   * NORMAL - SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-npm", () => {
    it("should update versions and push changes but not publish", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--skip-npm");

      expect(npmPublish).not.toBeCalled();
      expect(npmDistTag.check).not.toBeCalled();
      expect(npmDistTag.remove).not.toBeCalled();
      expect(npmDistTag.add).not.toBeCalled();

      expect(gitCommitMessage()).toEqual("v1.0.1");
      // FIXME
      // expect(GitUtilities.pushWithTags).lastCalledWith("origin", ["v1.0.1"]);
    });
  });

  /** =========================================================================
   * NORMAL - SKIP GIT AND SKIP NPM
   * ======================================================================= */

  describe("normal mode with --skip-git and --skip-npm", () => {
    it("should update versions but not push changes or publish", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--skip-git", "--skip-npm");

      expect(updatedLernaJson()).toMatchObject({ version: "1.0.1" });
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

      expect(GitUtilities.addFiles).not.toBeCalled();
      expect(GitUtilities.commit).not.toBeCalled();
      expect(GitUtilities.addTag).not.toBeCalled();
      expect(GitUtilities.pushWithTags).not.toBeCalled();

      expect(npmPublish).not.toBeCalled();
      expect(npmDistTag.check).not.toBeCalled();
      expect(npmDistTag.remove).not.toBeCalled();
      expect(npmDistTag.add).not.toBeCalled();
    });
  });

  /** =========================================================================
   * NORMAL - TEMP TAG
   * ======================================================================= */

  describe("normal mode with --temp-tag", () => {
    it("should publish the changed packages with a temp tag", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--temp-tag");

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
      expect(removedDistTagInDirectories(testDir)).toMatchSnapshot("npm dist-tag rm");
      expect(addedDistTagInDirectories(testDir)).toMatchSnapshot("npm dist-tag add");

      expect(GitUtilities.pushWithTags).lastCalledWith(
        "origin",
        ["v1.0.1"],
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
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--npm-tag", "custom");

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });
  });

  /** =========================================================================
   * AUTO-ACCEPT
   * ======================================================================= */

  describe("with --yes", () => {
    it("skips confirmation prompt", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--yes", "--repo-version", "1.0.1-auto-confirm");

      expect(PromptUtilities.select).not.toBeCalled();
      expect(PromptUtilities.confirm).not.toBeCalled();
      expect(updatedLernaJson()).toMatchObject({ version: "1.0.1-auto-confirm" });
    });
  });

  /** =========================================================================
   * NORMAL - REGISTRY
   * ======================================================================= */

  describe("normal mode with --registry", () => {
    it("passes registry to npm commands", async () => {
      const testDir = await initFixture("PublishCommand/normal");
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
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--repo-version", "1.0.1-beta");

      expect(PromptUtilities.select).not.toBeCalled();
      expect(updatedLernaJson()).toMatchObject({ version: "1.0.1-beta" });
    });
  });

  /** =========================================================================
   * NORMAL - EXACT
   * ======================================================================= */

  describe("normal mode with --exact", () => {
    it("updates matching local dependencies of published packages with exact versions", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--exact");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "1.0.1",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "1.0.1",
      });
      // package-4's dependency on package-1 remains semver because
      // it does not match the version of package-1 being published
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-1": "1.0.1",
      });
    });

    it("updates existing exact versions", async () => {
      const testDir = await initFixture("PublishCommand/normal-exact");
      await lernaPublish(testDir)();

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "1.0.1",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "1.0.1",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "0.1.0",
      });
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-1": "1.0.1",
      });
    });
  });

  /** =========================================================================
   * NORMAL MODE - CD VERSION
   * ======================================================================= */

  describe("normal mode with --cd-version", () => {
    it("should use semver increments when passed to cdVersion flag", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--cd-version", "minor");

      expect(PromptUtilities.select).not.toBeCalled();
      expect(gitCommitMessage()).toBe("v1.1.0");
    });

    it("throws an error when an invalid semver keyword is used", async () => {
      expect.assertions(1);

      const testDir = await initFixture("PublishCommand/normal");
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
    beforeEach(() => {
      GitUtilities.hasTags.mockReturnValueOnce(true);
      GitUtilities.getLastTag.mockReturnValueOnce("v1.0.1-beta.3");
      GitUtilities.diffSinceIn
        .mockReturnValueOnce("")
        .mockReturnValueOnce("")
        .mockReturnValueOnce("packages/package-3/newfile.json");
    });

    it("publishes changed & prereleased packages if --cd-version is non-prerelease", async () => {
      const testDir = await initFixture("PublishCommand/republish-prereleased");
      // should republish 3, 4, and 5 because:
      // package 3 changed
      // package 5 has a prerelease version
      // package 4 depends on package 5
      await lernaPublish(testDir)("--cd-version", "patch");

      expect(gitCommitMessage()).toBe("v1.0.1");
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-5": "^1.0.1",
      });
    });

    it("should not publish prereleased packages if --cd-version is a pre-* increment", async () => {
      const testDir = await initFixture("PublishCommand/republish-prereleased");
      // should republish only package 3, because it changed
      await lernaPublish(testDir)("--cd-version", "prerelease", "---preid", "beta");

      expect(gitCommitMessage()).toBe("v1.0.1-beta.4");
      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");
    });
  });

  /** =========================================================================
   * INDEPENDENT - CD VERSION
   * ======================================================================= */

  describe("indepdendent mode with --cd-version", () => {
    it("should use semver increments when passed to cdVersion flag", async () => {
      const testDir = await initFixture("PublishCommand/independent");
      await lernaPublish(testDir)("--cd-version", "patch");

      expect(PromptUtilities.select).not.toBeCalled();
      expect(gitCommitMessage()).toMatchSnapshot("git commit message");
    });

    /** =========================================================================
     * INDEPENDENT - CD VERSION - PRERELEASE
     * ======================================================================= */

    it("should bump to prerelease versions with --cd-version=prerelease --preid=foo", async () => {
      const testDir = await initFixture("PublishCommand/independent");
      await lernaPublish(testDir)("--cd-version", "prerelease", "--preid", "foo");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.0.1-foo.0",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^2.0.1-foo.0",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });
    });

    it("should bump to prerelease versions with --cd-version prerelease (no --preid)", async () => {
      const testDir = await initFixture("PublishCommand/independent");
      await lernaPublish(testDir)("--cd-version", "prerelease");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");

      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^1.0.1-0",
      });
      expect(updatedPackageJSON("package-3").devDependencies).toMatchObject({
        "package-2": "^2.0.1-0",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-1": "^0.0.0",
      });
    });
  });

  /** =========================================================================
   * NORMAL - GIT REMOTE
   * ======================================================================= */

  describe("normal mode with --git-remote", () => {
    it("pushes tags to specified remote", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--git-remote", "upstream");

      expect(GitUtilities.pushWithTags).lastCalledWith(
        "upstream",
        ["v1.0.1"],
        expect.objectContaining({
          cwd: testDir,
        })
      );
    });
  });

  /** =========================================================================
   * NORMAL - IGNORE
   * ======================================================================= */

  describe("normal mode with --ignore", () => {
    it("does not publish ignored packages", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--ignore", "package-2", "--ignore", "package-3", "--ignore", "package-4");

      expect(gitAddedFiles(testDir)).toMatchSnapshot("git added files");
      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });
  });

  /** =========================================================================
   * NORMAL - MESSAGE
   * ======================================================================= */

  describe("normal mode with --message", () => {
    it("commits changes with a custom message using %s", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--message", "chore: Release %s :rocket:");

      expect(GitUtilities.commit).lastCalledWith(
        "chore: Release v1.0.1 :rocket:",
        expect.objectContaining({
          cwd: testDir,
        })
      );
    });

    it("commits changes with a custom message using %v", async () => {
      const testDir = await initFixture("PublishCommand/normal");
      await lernaPublish(testDir)("--message", "chore: Release %v :rocket:");

      expect(GitUtilities.commit).lastCalledWith(
        "chore: Release 1.0.1 :rocket:",
        expect.objectContaining({
          cwd: testDir,
        })
      );
    });
  });

  /** =========================================================================
   * INDEPENDENT - MESSAGE
   * ======================================================================= */

  describe("independent mode with --message", () => {
    it("commits changes with a custom message", async () => {
      const testDir = await initFixture("PublishCommand/independent");
      await lernaPublish(testDir)("-m", "chore: Custom publish message");

      expect(GitUtilities.commit).lastCalledWith(
        expect.stringContaining("chore: Custom publish message"),
        expect.objectContaining({
          cwd: testDir,
        })
      );
      expect(gitCommitMessage()).toMatchSnapshot("git commit message");
    });
  });

  /** =========================================================================
   * CONVENTIONAL COMMITS
   * ======================================================================= */

  describe("--conventional-commits", () => {
    ConventionalCommitUtilities.updateChangelog.mockImplementation(pkg =>
      Promise.resolve(path.join(pkg.location, "CHANGELOG.md"))
    );

    describe("independent mode", () => {
      const versionBumps = ["1.0.1", "2.1.0", "4.0.0", "4.1.0", "5.0.1"];

      beforeEach(() => {
        versionBumps.forEach(bump =>
          ConventionalCommitUtilities.recommendVersion.mockResolvedValueOnce(bump)
        );
      });

      it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
        const testDir = await initFixture("PublishCommand/independent");

        await lernaPublish(testDir)("--conventional-commits");

        expect(gitAddedFiles(testDir)).toMatchSnapshot("git added files");
        expect(gitCommitMessage()).toMatchSnapshot("git commit message");

        ["package-1", "package-2", "package-3", "package-4", "package-5"].forEach((name, idx) => {
          expect(ConventionalCommitUtilities.recommendVersion).toBeCalledWith(
            expect.objectContaining({ name }),
            "independent",
            { changelogPreset: undefined }
          );
          expect(ConventionalCommitUtilities.updateChangelog).toBeCalledWith(
            expect.objectContaining({ name, version: versionBumps[idx] }),
            "independent",
            { changelogPreset: undefined }
          );
        });
      });

      it("accepts --changelog-preset option", async () => {
        const testDir = await initFixture("PublishCommand/independent");
        const changelogOpts = { changelogPreset: "foo-bar" };

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
        const testDir = await initFixture("PublishCommand/normal");

        await lernaPublish(testDir)("--conventional-commits");

        expect(gitAddedFiles(testDir)).toMatchSnapshot("git added files");
        expect(gitCommitMessage()).toMatchSnapshot("git commit message");

        ["package-1", "package-2", "package-3", "package-4", "package-5"].forEach(name => {
          const location = path.join(testDir, "packages", name);

          expect(ConventionalCommitUtilities.recommendVersion).toBeCalledWith(
            expect.objectContaining({ name, location }),
            "fixed",
            { changelogPreset: undefined }
          );

          expect(ConventionalCommitUtilities.updateChangelog).toBeCalledWith(
            expect.objectContaining({ name, version: "2.0.0" }),
            "fixed",
            { changelogPreset: undefined }
          );
        });

        expect(ConventionalCommitUtilities.updateChangelog).lastCalledWith(
          expect.objectContaining({
            name: "normal",
            location: testDir,
          }),
          "root",
          { changelogPreset: undefined, version: "2.0.0" }
        );
      });

      it("accepts --changelog-preset option", async () => {
        const testDir = await initFixture("PublishCommand/normal");
        const changelogOpts = { changelogPreset: "baz-qux" };

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
      const testDir = await initFixture("PublishCommand/normal-no-inter-dependencies");

      GitUtilities.hasTags.mockReturnValueOnce(true);
      GitUtilities.getLastTag.mockReturnValueOnce("v1.0.0");
      GitUtilities.diffSinceIn.mockReturnValueOnce(`packages/package-1/package.json`);

      // feat(package-1): add thing
      ConventionalCommitUtilities.recommendVersion.mockResolvedValueOnce("1.1.0");

      await lernaPublish(testDir)("--conventional-commits");

      expect(updatedPackageVersions(testDir)).toEqual({
        "packages/package-1": "1.1.0",
      });

      // make subsequent publish start with the right globalVersion
      await fs.writeJSON(path.join(testDir, "lerna.json"), { version: "1.1.0" });

      // clear previous publish mock records
      jest.clearAllMocks();

      GitUtilities.hasTags.mockReturnValueOnce(true);
      GitUtilities.getLastTag.mockReturnValueOnce("v1.1.0");
      GitUtilities.diffSinceIn
        .mockReturnValueOnce("") // package-1 has no changes
        .mockReturnValueOnce(`packages/package-2/package.json`);

      // fix(package-2): oops thing
      ConventionalCommitUtilities.recommendVersion.mockImplementationOnce(pkg =>
        Promise.resolve(semver.inc(pkg.version, "patch"))
      );

      await lernaPublish(testDir)("--conventional-commits", "--yes");

      expect(updatedPackageVersions(testDir)).toEqual({
        "packages/package-2": "1.1.1",
      });
    });
  });

  /** =========================================================================
   * INDEPENDENT - CANARY + NPMTAG + YES + EXACT
   * ======================================================================= */

  describe("independent mode --canary --npm-tag=next --yes --exact", () => {
    it("should publish the changed packages", async () => {
      const testDir = await initFixture("PublishCommand/independent");
      await lernaPublish(testDir)("--canary", "--npm-tag", "next", "--yes", "--exact");

      expect(publishedTagInDirectories(testDir)).toMatchSnapshot("npm published");
    });
  });

  describe("--allow-branch", () => {
    describe("cli", () => {
      it("should reject a non matching branch", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("unmatched");

        const testDir = await initFixture("PublishCommand/normal");
        try {
          await lernaPublish(testDir)("--allow-branch", "master");
        } catch (err) {
          expect(err.message).toMatch("Branch 'unmatched' is restricted from publishing");
        }
      });

      it("should accept an exactly matching branch", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("exact-match");

        const testDir = await initFixture("PublishCommand/normal");
        await lernaPublish(testDir)("--allow-branch", "exact-match");

        expect(publishedTagInDirectories(testDir)).toHaveLength(4);
      });

      it("should accept a branch that matches by wildcard", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("feature/awesome");

        const testDir = await initFixture("PublishCommand/normal");
        await lernaPublish(testDir)("--allow-branch", "feature/*");

        expect(publishedTagInDirectories(testDir)).toHaveLength(4);
      });

      it("should accept a branch that matches one of the items passed", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("feature/awesome");

        const testDir = await initFixture("PublishCommand/normal");
        await lernaPublish(testDir)("--allow-branch", "master", "feature/*");

        expect(publishedTagInDirectories(testDir)).toHaveLength(4);
      });
    });

    describe("lerna.json", () => {
      it("should reject a non matching branch", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("unmatched");

        const testDir = await initFixture("PublishCommand/allow-branch-lerna");
        try {
          await lernaPublish(testDir)();
        } catch (err) {
          expect(err.message).toMatch("Branch 'unmatched' is restricted from publishing");
        }
      });

      it("should accept a matching branch", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("lerna");

        const testDir = await initFixture("PublishCommand/allow-branch-lerna");
        await lernaPublish(testDir)();

        expect(publishedTagInDirectories(testDir)).toHaveLength(1);
      });

      it("should prioritize cli over defaults", async () => {
        GitUtilities.getCurrentBranch.mockReturnValueOnce("cli-override");

        const testDir = await initFixture("PublishCommand/allow-branch-lerna");
        await lernaPublish(testDir)("--allow-branch", "cli-override");

        expect(publishedTagInDirectories(testDir)).toHaveLength(1);
      });
    });

    describe("with --canary", () => {
      it("does not restrict publishing canary versions", async () => {
        const testDir = await initFixture("PublishCommand/normal");
        GitUtilities.getCurrentBranch.mockReturnValueOnce("other");

        await lernaPublish(testDir)("--allow-branch", "master", "--canary");
        expect(updatedPackageVersions(testDir)).toMatchSnapshot("updated packages");
      });
    });
  });

  /** =========================================================================
   * VERSION LIFECYCLE SCRIPTS
   * ======================================================================= */

  describe("lifecycle scripts", () => {
    const scripts = ["preversion", "version", "postversion"];

    it("should call version lifecycle scripts for a package", async () => {
      const testDir = await initFixture("PublishCommand/lifecycle");
      await lernaPublish(testDir)();

      scripts.forEach(script => {
        expect(npmRunScript).toHaveBeenCalledWith(script, {
          args: ["--silent"],
          npmClient: "npm",
          pkg: expect.objectContaining({
            name: "package-1",
            location: path.resolve(testDir, "packages", "package-1"),
          }),
        });
      });
    });

    it("should not call version lifecycle scripts for a package missing them", async () => {
      const testDir = await initFixture("PublishCommand/lifecycle");
      await lernaPublish(testDir)();

      scripts.forEach(script => {
        expect(npmRunScript).not.toHaveBeenCalledWith(script, {
          args: ["--silent"],
          npmClient: "npm",
          pkg: expect.objectContaining({
            name: "package-2",
            location: path.resolve(testDir, "packages", "package-2"),
          }),
        });
      });
    });

    it("should call version lifecycle scripts in the correct order", async () => {
      const testDir = await initFixture("PublishCommand/lifecycle");
      await lernaPublish(testDir)();

      expect(npmRunScript.mock.calls.map(args => args[0])).toEqual(scripts);
    });
  });

  it("publishes all transitive dependents after change", async () => {
    const testDir = await initFixture("PublishCommand/snake-graph");

    GitUtilities.hasTags.mockReturnValueOnce(true);
    GitUtilities.getLastTag.mockReturnValueOnce("v1.0.0");
    GitUtilities.diffSinceIn.mockReturnValueOnce("packages/package-1/package.json");

    await lernaPublish(testDir)("--cd-version", "major", "--yes");

    expect(updatedPackageVersions(testDir)).toMatchSnapshot();
  });

  describe("with git-hosted sibling dependencies", () => {
    it("updates gitCommittish versions as sshurls", async () => {
      const testDir = await initFixture("PublishCommand/git-hosted-sibling-committish");

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
      const testDir = await initFixture("PublishCommand/git-hosted-sibling-semver");

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
    beforeEach(() => {
      GitUtilities.hasTags.mockReturnValueOnce(true);
      GitUtilities.getLastTag.mockReturnValueOnce("v1.0.0");
      GitUtilities.diffSinceIn.mockReturnValueOnce("packages/package-1/package.json");
    });

    it("overwrites relative link with local version before npm publish but after git commit", async () => {
      const testDir = await initFixture("PublishCommand/relative-file-specs");

      await lernaPublish(testDir)("--cd-version", "major", "--yes");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot();

      // notably missing is package-1, which has no relative file: dependencies
      expect(updatedPackageJSON("package-2").dependencies).toMatchObject({
        "package-1": "^2.0.0",
      });
      expect(updatedPackageJSON("package-3").dependencies).toMatchObject({
        "package-2": "^2.0.0",
      });
      expect(updatedPackageJSON("package-4").dependencies).toMatchObject({
        "package-3": "^2.0.0",
      });
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-4": "^2.0.0",
        "package-6": "^1.0.0", // FIXME: awkward... (_intentional_, for now)
      });
      // private packages do not need local version resolution
      expect(updatedPackageJSON("package-7").dependencies).toMatchObject({
        "package-1": "file:../package-1",
      });
    });

    it("reverts overwritten link after publish", async () => {
      const testDir = await initFixture("PublishCommand/relative-file-specs");

      await lernaPublish(testDir)("--cd-version", "minor", "--yes");

      // notably missing is package-1, which has no relative file: dependencies
      ["package-2", "package-3", "package-4", "package-5"].forEach(pkgDir => {
        expect(GitUtilities.checkoutChanges).toBeCalledWith(
          path.join(testDir, "packages", pkgDir, "package.json"),
          expect.objectContaining({
            cwd: testDir,
          })
        );
      });
    });

    it("falls back to existing relative version when it is not updated", async () => {
      const testDir = await initFixture("PublishCommand/relative-independent");

      await lernaPublish(testDir)("--cd-version", "minor", "--yes");

      expect(updatedPackageVersions(testDir)).toMatchSnapshot();

      // package-4 was updated, but package-6 was not
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-4": "^4.1.0",
        "package-6": "^6.0.0",
      });
    });

    it("respects --exact", async () => {
      const testDir = await initFixture("PublishCommand/relative-independent");

      await lernaPublish(testDir)("--cd-version", "patch", "--yes", "--exact");

      // package-4 was updated, but package-6 was not
      expect(updatedPackageJSON("package-5").dependencies).toMatchObject({
        "package-4": "4.0.1",
        "package-6": "6.0.0",
      });
    });
  });

  describe("in a cyclical repo", () => {
    it("should throw an error with --reject-cycles", async () => {
      expect.assertions(1);

      try {
        const testDir = await initFixture("PackageUtilities/toposort");

        await lernaPublish(testDir)("--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });
});
