/* eslint-disable max-len */
// too many long lines in this file to bother

import dedent from "dedent";
import path from "path";

// mocked modules
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";

// file under test
import ConventionalCommitUtilities from "../src/ConventionalCommitUtilities";

jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/FileSystemUtilities");

describe("ConventionalCommitUtilities", () => {
  afterEach(() => jest.resetAllMocks());

  describe(".recommendVersion()", () => {
    it("should invoke conventional-changelog-recommended bump to fetch next version", () => {
      ChildProcessUtilities.execSync = jest.fn(() => "major");

      const opts = { cwd: "test" };

      const args = [
        require.resolve("conventional-recommended-bump/cli"),
        "-l", "bar",
        "--commit-path", "/foo/bar",
        "-p", "angular",
      ];

      const recommendVersion = ConventionalCommitUtilities.recommendVersion({
        name: "bar",
        version: "1.0.0",
        location: "/foo/bar",
      }, opts, "", args);

      expect(recommendVersion).toBe("2.0.0");
      expect(ChildProcessUtilities.execSync).lastCalledWith(process.execPath, args, opts);
    });
  });

  describe(".updateChangelog()", () => {
    it("should populate initial CHANGELOG.md if it does not exist", () => {
      FileSystemUtilities.existsSync = jest.fn(() => false);
      ChildProcessUtilities.execSync = jest.fn(() => "<a name='change' />feat: I should be placed in the CHANGELOG");

      const opts = { cwd: "test" };

      const args = [
        require.resolve("conventional-changelog-cli/cli"),
        "-l", "bar",
        "--commit-path", "/foo/bar",
        "--pkg", path.normalize("/foo/bar/package.json"),
        "-p", "angular",
      ];

      ConventionalCommitUtilities.updateChangelog({
        name: "bar",
        location: "/foo/bar"
      }, opts, "", args);

      expect(FileSystemUtilities.existsSync).lastCalledWith(path.normalize("/foo/bar/CHANGELOG.md"));
      expect(ChildProcessUtilities.execSync).lastCalledWith(process.execPath, args, opts);
      expect(FileSystemUtilities.writeFileSync).lastCalledWith(
        path.normalize("/foo/bar/CHANGELOG.md"),
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name='change' />feat: I should be placed in the CHANGELOG
        `
      );
    });

    it("should insert into existing CHANGELOG.md", () => {
      FileSystemUtilities.existsSync = jest.fn(() => true);
      ChildProcessUtilities.execSync = jest.fn(() => "<a name='change2' />fix: a second commit for our CHANGELOG");
      FileSystemUtilities.readFileSync = jest.fn(() => dedent`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        <a name='change' />feat: I should be placed in the CHANGELOG
      `);

      ConventionalCommitUtilities.updateChangelog({
        name: "bar",
        location: "/foo/bar/",
      });

      expect(FileSystemUtilities.writeFileSync).lastCalledWith(
        path.normalize("/foo/bar/CHANGELOG.md"),
        dedent`
          # Change Log

          All notable changes to this project will be documented in this file.
          See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

          <a name='change2' />fix: a second commit for our CHANGELOG

          <a name='change' />feat: I should be placed in the CHANGELOG
        `
      );
    });
  });
});
