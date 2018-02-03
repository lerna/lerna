"use strict";

const dedent = require("dedent");
const path = require("path");
const Package = require("../src/Package");

// mocked modules
const ChildProcessUtilities = require("../src/ChildProcessUtilities");
const FileSystemUtilities = require("../src/FileSystemUtilities");

// file under test
const ConventionalCommitUtilities = require("../src/ConventionalCommitUtilities");

jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/FileSystemUtilities");

describe("ConventionalCommitUtilities", () => {
  afterEach(() => jest.resetAllMocks());

  describe(".recommendVersion()", () => {
    it("invokes conventional-changelog-recommended bump to fetch next version", () => {
      ChildProcessUtilities.execSync.mockReturnValueOnce("major");

      const bumpedVersion = ConventionalCommitUtilities.recommendVersion(
        new Package({ name: "bar", version: "1.0.0" }, "/foo/bar"),
        "fixed",
        { cwd: "test-fixed-bump" }
      );

      expect(bumpedVersion).toBe("2.0.0");
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        process.execPath,
        [require.resolve("conventional-recommended-bump/cli"), "-p", "angular", "--commit-path", "/foo/bar"],
        { cwd: "test-fixed-bump" }
      );
    });

    it("passes package-specific arguments in independent mode", () => {
      ChildProcessUtilities.execSync.mockReturnValueOnce("minor");

      const bumpedVersion = ConventionalCommitUtilities.recommendVersion(
        new Package({ name: "bar", version: "1.0.0" }, "/foo/bar"),
        "independent",
        { cwd: "test-independent-bump" }
      );

      expect(bumpedVersion).toBe("1.1.0");
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        process.execPath,
        [
          require.resolve("conventional-recommended-bump/cli"),
          "-p",
          "angular",
          "--commit-path",
          "/foo/bar",
          "-l",
          "bar",
        ],
        { cwd: "test-independent-bump" }
      );
    });
  });

  describe(".updateChangelog()", () => {
    beforeEach(() => {
      ChildProcessUtilities.execSync.mockReturnValue(
        dedent`<a name="1.0.0"></a>

          ### Features

          * feat: I should be placed in the CHANGELOG`
      );
    });

    it("populates initial CHANGELOG.md if it does not exist", () => {
      expect(
        ConventionalCommitUtilities.updateChangelog(
          new Package({ name: "bar", version: "1.0.0" }, "/foo/bar")
        )
      ).toBe(path.normalize("/foo/bar/CHANGELOG.md"));

      expect(FileSystemUtilities.existsSync).lastCalledWith(path.normalize("/foo/bar/CHANGELOG.md"));
      expect(FileSystemUtilities.writeFileSync).lastCalledWith(
        path.normalize("/foo/bar/CHANGELOG.md"),
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name="1.0.0"></a>

          ### Features

          * feat: I should be placed in the CHANGELOG`
      );
    });

    it("appends to existing CHANGELOG.md", () => {
      FileSystemUtilities.existsSync.mockReturnValueOnce(true);
      ChildProcessUtilities.execSync.mockReturnValueOnce(
        dedent`<a name='change2' /></a>
          ## 1.0.1 (2017-08-11)(/compare/v1.0.1...v1.0.0) (2017-08-09)


          ### Bug Fixes

          * fix: a second commit for our CHANGELOG`
      );

      FileSystemUtilities.readFileSync.mockReturnValueOnce(
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name="1.0.0"></a>

          ### Features

          * feat: I should be placed in the CHANGELOG
        `
      );

      ConventionalCommitUtilities.updateChangelog(new Package({ name: "bar", version: "1.0.0" }, "/foo/bar"));

      expect(FileSystemUtilities.writeFileSync).lastCalledWith(
        path.normalize("/foo/bar/CHANGELOG.md"),
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name='change2' /></a>
          ## 1.0.1 (2017-08-11)(/compare/v1.0.1...v1.0.0) (2017-08-09)


          ### Bug Fixes

          * fix: a second commit for our CHANGELOG

          <a name="1.0.0"></a>

          ### Features

          * feat: I should be placed in the CHANGELOG
        `
      );
    });

    it("appends version bump message if no commits have been recorded", () => {
      FileSystemUtilities.existsSync.mockReturnValueOnce(true);
      ChildProcessUtilities.execSync.mockReturnValueOnce(
        dedent`<a name="1.0.1"></a>
          ## 1.0.1 (2017-08-11)(/compare/v1.0.1...v1.0.0) (2017-08-09)`
      );
      FileSystemUtilities.readFileSync.mockReturnValueOnce(
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name="1.0.0"></a>

          ### Features

          * add a feature aaa1111
        `
      );

      ConventionalCommitUtilities.updateChangelog(new Package({ name: "bar", version: "1.0.0" }, "/foo/bar"));

      expect(FileSystemUtilities.writeFileSync).lastCalledWith(
        path.normalize("/foo/bar/CHANGELOG.md"),
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name="1.0.1"></a>
          ## 1.0.1 (2017-08-11)(/compare/v1.0.1...v1.0.0) (2017-08-09)

          **Note:** Version bump only for package bar

          <a name="1.0.0"></a>

          ### Features

          * add a feature aaa1111
        `
      );
    });

    it("passes package-specific arguments in independent mode", () => {
      const pkg = new Package({ name: "bar", version: "1.0.0" }, "/foo/bar");

      ConventionalCommitUtilities.updateChangelog(pkg, "independent", { cwd: "test-independent" });

      expect(ChildProcessUtilities.execSync).lastCalledWith(
        process.execPath,
        [
          require.resolve("conventional-changelog-cli/cli"),
          "-p",
          "angular",
          "--commit-path",
          pkg.location,
          "--pkg",
          pkg.manifestLocation,
          "-l",
          pkg.name,
        ],
        { cwd: "test-independent" }
      );
    });

    it("passes package-specific arguments in fixed mode", () => {
      const pkg = new Package({ name: "bar", version: "1.0.0" }, "/foo/bar");

      ConventionalCommitUtilities.updateChangelog(pkg, "fixed", { cwd: "test-fixed" });

      expect(ChildProcessUtilities.execSync).lastCalledWith(
        process.execPath,
        [
          require.resolve("conventional-changelog-cli/cli"),
          "-p",
          "angular",
          "--commit-path",
          pkg.location,
          "--pkg",
          pkg.manifestLocation,
        ],
        { cwd: "test-fixed" }
      );
    });

    it("passes custom context in fixed root mode", () => {
      ConventionalCommitUtilities.updateChangelog(
        {
          name: "bar",
          location: "/foo/bar",
        },
        "root",
        { cwd: "test-fixed-root" }
      );

      expect(ChildProcessUtilities.execSync).lastCalledWith(
        process.execPath,
        [
          require.resolve("conventional-changelog-cli/cli"),
          "-p",
          "angular",
          "--context",
          path.resolve(__dirname, "..", "src", "ConventionalChangelogContext.js"),
        ],
        { cwd: "test-fixed-root" }
      );
    });
  });
});
