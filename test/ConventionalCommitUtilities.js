import assert from "assert";
import dedent from "dedent";
import assertStubbedCalls from "./_assertStubbedCalls";
import path from "path";

import ConventionalCommitUtilities from "../src/ConventionalCommitUtilities";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";

describe("ConventionalCommitUtilities", () => {
  describe(".recommendVersion()", () => {
    it("should invoke conventional-changelog-recommended bump to fetch next version", () => {
      assertStubbedCalls([
        [ChildProcessUtilities, "execSync", {}, [
          {
            args: [require.resolve("conventional-recommended-bump/cli.js") + " -l bar --commit-path=/foo/bar -p angular"],
            returns: "major"
          }
        ]],
      ]);

      const recommendedVersion = ConventionalCommitUtilities.recommendVersion({
        name: "bar",
        version: "1.0.0",
        location: "/foo/bar"
      });

      assert.equal(recommendedVersion, "2.0.0");
    });
  });

  describe(".updateChangelog()", () => {
    it("should populate initial CHANGELOG.md if it does not exist", () => {
      assertStubbedCalls([
        [FileSystemUtilities, "existsSync", {}, [
          {
            args: [path.normalize("/foo/bar/CHANGELOG.md")],
            returns: false
          }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          {
            args: [`${require.resolve("conventional-changelog-cli/cli.js")} -l bar --commit-path=/foo/bar --pkg=${path.normalize("/foo/bar/package.json")} -p angular`],
            returns: "<a name='change' />feat: I should be placed in the CHANGELOG"
          }
        ]],
        [FileSystemUtilities, "writeFileSync", {}, [
          {
            args: [path.normalize("/foo/bar/CHANGELOG.md"), dedent(`
            # Change Log

            All notable changes to this project will be documented in this file.
            See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

            <a name='change' />feat: I should be placed in the CHANGELOG`)],
            returns: null
          }
        ]]
      ]);

      ConventionalCommitUtilities.updateChangelog({
        name: "bar",
        location: "/foo/bar"
      });
    });

    it("should insert into existing CHANGELOG.md", () => {
      assertStubbedCalls([
        [FileSystemUtilities, "existsSync", {}, [
          {
            args: [path.normalize("/foo/bar/CHANGELOG.md")],
            returns: true
          }
        ]],
        [FileSystemUtilities, "readFileSync", {}, [
          {
            args: [path.normalize("/foo/bar/CHANGELOG.md")],
            returns: dedent(`
            # Change Log

            All notable changes to this project will be documented in this file.
            See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

            <a name='change' />feat: I should be placed in the CHANGELOG`)
          }
        ]],
        [ChildProcessUtilities, "execSync", {}, [
          {
            args: [`${require.resolve("conventional-changelog-cli/cli.js")} -l bar --commit-path=/foo/bar/ --pkg=${path.normalize("/foo/bar/package.json")} -p angular`],
            returns: "<a name='change2' />fix: a second commit for our CHANGELOG"
          }
        ]],
        [FileSystemUtilities, "writeFileSync", {}, [
          {
            args: [path.normalize("/foo/bar/CHANGELOG.md"), dedent(`
            # Change Log

            All notable changes to this project will be documented in this file.
            See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

            <a name='change2' />fix: a second commit for our CHANGELOG

            <a name='change' />feat: I should be placed in the CHANGELOG`)],
            returns: null
          }
        ]]
      ]);

      ConventionalCommitUtilities.updateChangelog({
        name: "bar",
        location: "/foo/bar/"
      });
    });
  });
});
