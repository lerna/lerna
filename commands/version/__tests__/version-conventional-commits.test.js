"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const path = require("path");
const semver = require("semver");

// mocked modules
const writePkg = require("write-pkg");
const collectUpdates = require("@lerna/collect-updates");
const ConventionalCommitUtilities = require("@lerna/conventional-commits");

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));
const showCommit = require("@lerna-test/show-commit");

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

describe("--conventional-commits", () => {
  describe("independent", () => {
    const versionBumps = new Map([
      ["package-1", "1.0.1"],
      ["package-2", "2.1.0"],
      ["package-3", "4.0.0"],
      ["package-4", "4.1.0"],
      ["package-5", "5.0.1"],
    ]);

    beforeEach(() => {
      ConventionalCommitUtilities.mockBumps(...versionBumps.values());
    });

    it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
      const cwd = await initFixture("independent");

      await lernaVersion(cwd)("--conventional-commits");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      versionBumps.forEach((version, name) => {
        expect(ConventionalCommitUtilities.recommendVersion).toBeCalledWith(
          expect.objectContaining({ name }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );
        expect(ConventionalCommitUtilities.updateChangelog).toBeCalledWith(
          expect.objectContaining({ name, version }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );
      });
    });

    it("accepts --changelog-preset option", async () => {
      const cwd = await initFixture("independent");
      const changelogOpts = { changelogPreset: "foo-bar", rootPath: cwd, tagPrefix: "v" };

      await lernaVersion(cwd)("--conventional-commits", "--changelog-preset", "foo-bar");

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
      ConventionalCommitUtilities.mockBumps("1.0.1", "1.1.0", "2.0.0", "1.1.0", "1.0.0");
    });

    it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
      const cwd = await initFixture("normal");

      await lernaVersion(cwd)("--conventional-commits");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      ["package-1", "package-2", "package-3", "package-4", "package-5"].forEach(name => {
        const location = path.join(cwd, "packages", name);

        expect(ConventionalCommitUtilities.recommendVersion).toBeCalledWith(
          expect.objectContaining({ name, location }),
          "fixed",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );

        expect(ConventionalCommitUtilities.updateChangelog).toBeCalledWith(
          expect.objectContaining({ name, version: "2.0.0" }),
          "fixed",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );
      });

      expect(ConventionalCommitUtilities.updateChangelog).lastCalledWith(
        expect.objectContaining({
          name: "normal",
          location: cwd,
        }),
        "root",
        { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", version: "2.0.0" }
      );
    });

    it("accepts --changelog-preset option", async () => {
      const cwd = await initFixture("normal");
      const changelogOpts = {
        changelogPreset: "baz-qux",
        rootPath: cwd,
        tagPrefix: "dragons-are-awesome",
      };

      await lernaVersion(cwd)(
        "--conventional-commits",
        "--changelog-preset",
        "baz-qux",
        "--tag-version-prefix",
        "dragons-are-awesome"
      );

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
    const cwd = await initFixture("normal-no-inter-dependencies");

    collectUpdates.setUpdated(cwd, "package-1");
    ConventionalCommitUtilities.recommendVersion.mockResolvedValueOnce("1.1.0");

    await lernaVersion(cwd)("--conventional-commits");

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "1.1.0",
    });

    // clear previous publish mock records
    jest.clearAllMocks();
    writePkg.registry.clear();

    collectUpdates.setUpdated(cwd, "package-2");
    ConventionalCommitUtilities.recommendVersion.mockImplementationOnce(pkg =>
      Promise.resolve(semver.inc(pkg.version, "patch"))
    );

    await lernaVersion(cwd)("--conventional-commits");

    expect(writePkg.updatedVersions()).toEqual({
      "package-2": "1.1.1",
    });
  });
});
