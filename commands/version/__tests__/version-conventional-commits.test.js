"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");
jest.mock("../lib/remote-branch-exists");

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

    const prereleaseVersionBumps = new Map([
      ["package-1", "1.0.1-alpha.0"],
      ["package-2", "2.1.0-alpha.0"],
      ["package-3", "4.0.0-beta.0"],
      ["package-4", "4.1.0-alpha.0"],
      ["package-5", "5.0.1-alpha.0"],
    ]);

    it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
      versionBumps.forEach(bump => ConventionalCommitUtilities.recommendVersion.mockResolvedValueOnce(bump));

      const cwd = await initFixture("independent");

      await lernaVersion(cwd)("--conventional-commits");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      versionBumps.forEach((version, name) => {
        expect(ConventionalCommitUtilities.recommendVersion).toHaveBeenCalledWith(
          expect.objectContaining({ name }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", prereleaseId: undefined }
        );
        expect(ConventionalCommitUtilities.updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", prereleaseId: undefined }
        );
      });
    });

    it("should guess prerelease version bumps and generate CHANGELOG", async () => {
      prereleaseVersionBumps.forEach(bump =>
        ConventionalCommitUtilities.recommendVersion.mockResolvedValueOnce(bump)
      );
      const cwd = await initFixture("prerelease-independent");

      await lernaVersion(cwd)("--conventional-commits", "--conventional-prerelease");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      prereleaseVersionBumps.forEach((version, name) => {
        const prereleaseId = semver.prerelease(version)[0];
        expect(ConventionalCommitUtilities.recommendVersion).toHaveBeenCalledWith(
          expect.objectContaining({ name }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", prereleaseId }
        );
        expect(ConventionalCommitUtilities.updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );
      });
    });

    it("should graduate prerelease version bumps and generate CHANGELOG", async () => {
      versionBumps.forEach(bump => ConventionalCommitUtilities.recommendVersion.mockResolvedValueOnce(bump));
      const cwd = await initFixture("prerelease-independent");

      await lernaVersion(cwd)("--conventional-commits", "--conventional-graduate");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      versionBumps.forEach((version, name) => {
        expect(ConventionalCommitUtilities.recommendVersion).toHaveBeenCalledWith(
          expect.objectContaining({ name }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", prerelease: undefined }
        );
        expect(ConventionalCommitUtilities.updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );
      });
    });

    it("accepts --changelog-preset option", async () => {
      const cwd = await initFixture("independent");
      const changelogOpts = {
        changelogPreset: "foo-bar",
        rootPath: cwd,
        tagPrefix: "v",
        prereleaseId: undefined,
      };

      await lernaVersion(cwd)("--conventional-commits", "--changelog-preset", "foo-bar");

      expect(ConventionalCommitUtilities.recommendVersion).toHaveBeenCalledWith(
        expect.any(Object),
        "independent",
        changelogOpts
      );
      expect(ConventionalCommitUtilities.updateChangelog).toHaveBeenCalledWith(
        expect.any(Object),
        "independent",
        changelogOpts
      );
    });

    it("should not update changelogs with --no-changelog option", async () => {
      const cwd = await initFixture("independent");
      await lernaVersion(cwd)("--conventional-commits", "--no-changelog");

      expect(ConventionalCommitUtilities.updateChangelog).not.toHaveBeenCalled();
    });
  });

  describe("fixed mode", () => {
    it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
      ConventionalCommitUtilities.recommendVersion
        .mockResolvedValueOnce("1.0.1")
        .mockResolvedValueOnce("1.1.0")
        .mockResolvedValueOnce("2.0.0")
        .mockResolvedValueOnce("1.1.0")
        .mockResolvedValueOnce("1.0.0");

      const cwd = await initFixture("normal");

      await lernaVersion(cwd)("--conventional-commits");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      ["package-1", "package-2", "package-3", "package-4", "package-5"].forEach(name => {
        const location = path.join(cwd, "packages", name);

        expect(ConventionalCommitUtilities.recommendVersion).toHaveBeenCalledWith(
          expect.objectContaining({ name, location }),
          "fixed",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", prereleaseId: undefined }
        );

        expect(ConventionalCommitUtilities.updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version: "2.0.0" }),
          "fixed",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", prereleaseId: undefined }
        );
      });

      expect(ConventionalCommitUtilities.updateChangelog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: "normal",
          location: cwd,
        }),
        "root",
        {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: "v",
          version: "2.0.0",
          prereleaseId: undefined,
        }
      );
    });

    it("should guess prerelease version bumps and generate CHANGELOG", async () => {
      ConventionalCommitUtilities.recommendVersion
        .mockResolvedValueOnce("1.0.1-alpha.0")
        .mockResolvedValueOnce("1.1.0-alpha.0")
        .mockResolvedValueOnce("2.0.0-alpha.0")
        .mockResolvedValueOnce("1.1.0-alpha.0")
        .mockResolvedValueOnce("1.0.0-alpha.0");

      const cwd = await initFixture("normal");

      await lernaVersion(cwd)("--conventional-commits", "--conventional-prerelease");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      ["package-1", "package-2", "package-3", "package-4", "package-5"].forEach(name => {
        const location = path.join(cwd, "packages", name);

        expect(ConventionalCommitUtilities.recommendVersion).toHaveBeenCalledWith(
          expect.objectContaining({ name, location }),
          "fixed",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", prereleaseId: "alpha" }
        );

        expect(ConventionalCommitUtilities.updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version: "2.0.0-alpha.0" }),
          "fixed",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );
      });

      expect(ConventionalCommitUtilities.updateChangelog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: "normal",
          location: cwd,
        }),
        "root",
        {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: "v",
          version: "2.0.0-alpha.0",
          prereleaseId: undefined,
        }
      );
    });

    it("accepts --changelog-preset option", async () => {
      const cwd = await initFixture("normal");
      const changelogOpts = {
        changelogPreset: "baz-qux",
        rootPath: cwd,
        tagPrefix: "dragons-are-awesome",
        prereleaseId: undefined,
      };

      await lernaVersion(cwd)(
        "--conventional-commits",
        "--changelog-preset",
        "baz-qux",
        "--tag-version-prefix",
        "dragons-are-awesome"
      );

      expect(ConventionalCommitUtilities.recommendVersion).toHaveBeenCalledWith(
        expect.any(Object),
        "fixed",
        changelogOpts
      );
      expect(ConventionalCommitUtilities.updateChangelog).toHaveBeenCalledWith(
        expect.any(Object),
        "fixed",
        changelogOpts
      );
    });

    it("should not update changelogs with --no-changelog option", async () => {
      const cwd = await initFixture("normal");
      await lernaVersion(cwd)("--conventional-commits", "--no-changelog");

      expect(ConventionalCommitUtilities.updateChangelog).not.toHaveBeenCalled();
    });
  });

  it("avoids duplicating previously-released version", async () => {
    const cwd = await initFixture("no-interdependencies");

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
