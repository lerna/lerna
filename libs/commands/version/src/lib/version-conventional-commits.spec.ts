import {
  collectUpdates as _collectUpdates,
  recommendVersion as _recommendVersion,
  updateChangelog as _updateChangelog,
} from "@lerna/core";
import { commandRunner, initFixtureFactory, showCommit } from "@lerna/test-helpers";
import path from "path";
import semver from "semver";
import _writePkg from "write-pkg";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("write-pkg", () => require("@lerna/test-helpers/__mocks__/write-pkg"));

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

jest.mock("./git-push");
jest.mock("./is-anything-committed", () => ({
  isAnythingCommitted: jest.fn().mockReturnValue(true),
}));
jest.mock("./is-behind-upstream", () => ({
  isBehindUpstream: jest.fn().mockReturnValue(false),
}));
jest.mock("./remote-branch-exists", () => ({
  remoteBranchExists: jest.fn().mockResolvedValue(true),
}));

// The mocked version isn't the same as the real one
const updateChangelog = _updateChangelog as any;
const collectUpdates = _collectUpdates as any;
const recommendVersion = _recommendVersion as any;
const writePkg = _writePkg as any;

const initFixture = initFixtureFactory(path.resolve(__dirname, "../../../publish"));

// test command
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaVersion = commandRunner(require("../command"));

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
      versionBumps.forEach((bump) => recommendVersion.mockResolvedValueOnce(bump));

      const cwd = await initFixture("independent");

      await lernaVersion(cwd)("--conventional-commits");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      versionBumps.forEach((version, name) => {
        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name }), "independent", {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: "v",
          prereleaseId: undefined,
          buildMetadata: undefined,
        });
        expect(updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", prereleaseId: undefined }
        );
      });
    });

    it("should guess prerelease version bumps and generate CHANGELOG", async () => {
      prereleaseVersionBumps.forEach((bump) => recommendVersion.mockResolvedValueOnce(bump));
      const cwd = await initFixture("prerelease-independent");

      await lernaVersion(cwd)("--conventional-commits", "--conventional-prerelease");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      prereleaseVersionBumps.forEach((version, name) => {
        const prereleaseId = semver.prerelease(version)[0];
        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name }), "independent", {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: "v",
          prereleaseId,
          buildMetadata: undefined,
        });
        expect(updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );
      });
    });

    it("should call recommended version with conventionalBumpPrerelease set", async () => {
      prereleaseVersionBumps.forEach((bump) => recommendVersion.mockResolvedValueOnce(bump));
      const cwd = await initFixture("prerelease-independent");

      await lernaVersion(cwd)(
        "--conventional-commits",
        "--conventional-prerelease",
        "--conventional-bump-prerelease"
      );

      prereleaseVersionBumps.forEach((version, name) => {
        const prereleaseId = semver.prerelease(version)[0];
        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name }), "independent", {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: "v",
          prereleaseId,
          conventionalBumpPrerelease: true,
        });
        expect(updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version }),
          "independent",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );
      });
    });

    it("should graduate prerelease version bumps and generate CHANGELOG", async () => {
      versionBumps.forEach((bump) => recommendVersion.mockResolvedValueOnce(bump));
      const cwd = await initFixture("prerelease-independent");

      await lernaVersion(cwd)("--conventional-commits", "--conventional-graduate");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      versionBumps.forEach((version, name) => {
        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name }), "independent", {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: "v",
          prerelease: undefined,
          buildMetadata: undefined,
        });
        expect(updateChangelog).toHaveBeenCalledWith(
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
        buildMetadata: undefined,
      };

      await lernaVersion(cwd)("--conventional-commits", "--changelog-preset", "foo-bar");

      expect(recommendVersion).toHaveBeenCalledWith(expect.any(Object), "independent", changelogOpts);
      expect(updateChangelog).toHaveBeenCalledWith(expect.any(Object), "independent", changelogOpts);
    });

    it("should not update changelogs with --no-changelog option", async () => {
      const cwd = await initFixture("independent");
      await lernaVersion(cwd)("--conventional-commits", "--no-changelog");

      expect(updateChangelog).not.toHaveBeenCalled();
    });

    it("should respect --no-private", async () => {
      const cwd = await initFixture("independent");
      // TODO: (major) make --no-private the default
      await lernaVersion(cwd)("--conventional-commits", "--no-private");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).not.toContain("package-5");
    });

    it("accepts --build-metadata option", async () => {
      const buildMetadata = "001";
      versionBumps.forEach((bump) => recommendVersion.mockResolvedValueOnce(`${bump}+${buildMetadata}`));
      const cwd = await initFixture("independent");

      const changelogOpts = {
        changelogPreset: undefined,
        rootPath: cwd,
        tagPrefix: "v",
        prereleaseId: undefined,
      };

      await lernaVersion(cwd)("--conventional-commits", "--build-metadata", buildMetadata);

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      expect(recommendVersion).toHaveBeenCalledWith(expect.any(Object), "independent", {
        ...changelogOpts,
        buildMetadata,
      });
      expect(updateChangelog).toHaveBeenCalledWith(expect.any(Object), "independent", changelogOpts);
    });
  });

  describe("fixed mode", () => {
    it("should use conventional-commits utility to guess version bump and generate CHANGELOG", async () => {
      recommendVersion
        .mockResolvedValueOnce("1.0.1")
        .mockResolvedValueOnce("1.1.0")
        .mockResolvedValueOnce("2.0.0")
        .mockResolvedValueOnce("1.1.0")
        .mockResolvedValueOnce("1.0.0");

      const cwd = await initFixture("normal");

      await lernaVersion(cwd)("--conventional-commits");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      ["package-1", "package-2", "package-3", "package-4", "package-5"].forEach((name) => {
        const location = path.join(cwd, "packages", name);

        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name, location }), "fixed", {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: "v",
          prereleaseId: undefined,
          buildMetadata: undefined,
        });

        expect(updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version: "2.0.0" }),
          "fixed",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v", prereleaseId: undefined }
        );
      });

      expect(updateChangelog).toHaveBeenLastCalledWith(
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
      recommendVersion
        .mockResolvedValueOnce("1.0.1-alpha.0")
        .mockResolvedValueOnce("1.1.0-alpha.0")
        .mockResolvedValueOnce("2.0.0-alpha.0")
        .mockResolvedValueOnce("1.1.0-alpha.0")
        .mockResolvedValueOnce("1.0.0-alpha.0");

      const cwd = await initFixture("normal");

      await lernaVersion(cwd)("--conventional-commits", "--conventional-prerelease");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).toMatchSnapshot();

      ["package-1", "package-2", "package-3", "package-4", "package-5"].forEach((name) => {
        const location = path.join(cwd, "packages", name);

        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name, location }), "fixed", {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: "v",
          prereleaseId: "alpha",
          buildMetadata: undefined,
        });

        expect(updateChangelog).toHaveBeenCalledWith(
          expect.objectContaining({ name, version: "2.0.0-alpha.0" }),
          "fixed",
          { changelogPreset: undefined, rootPath: cwd, tagPrefix: "v" }
        );
      });

      expect(updateChangelog).toHaveBeenLastCalledWith(
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

      expect(recommendVersion).toHaveBeenCalledWith(expect.any(Object), "fixed", {
        ...changelogOpts,
        buildMetadata: undefined,
      });
      expect(updateChangelog).toHaveBeenCalledWith(expect.any(Object), "fixed", changelogOpts);
    });

    it("should not update changelogs with --no-changelog option", async () => {
      const cwd = await initFixture("normal");
      await lernaVersion(cwd)("--conventional-commits", "--no-changelog");

      expect(updateChangelog).not.toHaveBeenCalled();
    });

    it("should respect --no-private", async () => {
      const cwd = await initFixture("normal");
      // TODO: (major) make --no-private the default
      await lernaVersion(cwd)("--conventional-commits", "--no-private");

      const changedFiles = await showCommit(cwd, "--name-only");
      expect(changedFiles).not.toContain("package-5");
    });
  });

  it("avoids duplicating previously-released version", async () => {
    const cwd = await initFixture("no-interdependencies");

    collectUpdates.setUpdated(cwd, "package-1");
    recommendVersion.mockResolvedValueOnce("1.1.0");

    await lernaVersion(cwd)("--conventional-commits");

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "1.1.0",
    });

    // clear previous publish mock records
    jest.clearAllMocks();
    writePkg.registry.clear();

    collectUpdates.setUpdated(cwd, "package-2");
    recommendVersion.mockImplementationOnce((pkg) => Promise.resolve(semver.inc(pkg.version, "patch")));

    await lernaVersion(cwd)("--conventional-commits");

    expect(writePkg.updatedVersions()).toEqual({
      "package-2": "1.1.1",
    });
  });

  it("accepts --build-metadata option", async () => {
    const buildMetadata = "exp.sha.5114f85";
    recommendVersion.mockResolvedValueOnce(`1.0.1+${buildMetadata}`);
    const cwd = await initFixture("normal");

    const changelogOpts = {
      changelogPreset: undefined,
      rootPath: cwd,
      tagPrefix: "v",
      prereleaseId: undefined,
    };

    await lernaVersion(cwd)("--conventional-commits", "--build-metadata", buildMetadata);

    const changedFiles = await showCommit(cwd, "--name-only");
    expect(changedFiles).toMatchSnapshot();

    expect(recommendVersion).toHaveBeenCalledWith(expect.any(Object), "fixed", {
      ...changelogOpts,
      buildMetadata,
    });
    expect(updateChangelog).toHaveBeenCalledWith(expect.any(Object), "fixed", changelogOpts);
  });
});
