"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const path = require("path");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const GitUtilities = require("..");

describe("GitUtilities", () => {
  describe(".hasTags()", () => {
    it("returns true when one or more git tags exist", async () => {
      const cwd = await initFixture("basic");

      expect(GitUtilities.hasTags({ cwd })).toBe(false);

      await execa("git", ["tag", "v1.2.3", "-m", "v1.2.3"], { cwd });
      expect(GitUtilities.hasTags({ cwd })).toBe(true);
    });
  });

  describe(".getLastTaggedCommit()", () => {
    it("returns SHA of closest git tag", async () => {
      const cwd = await initFixture("basic");

      await execa("git", ["tag", "v1.2.3", "-m", "v1.2.3"], { cwd });

      expect(GitUtilities.getLastTaggedCommit({ cwd })).toMatch(/^[0-9a-f]{40}$/);
    });
  });

  describe(".getFirstCommit()", () => {
    it("returns SHA of first commit", async () => {
      const cwd = await initFixture("basic");

      expect(GitUtilities.getFirstCommit({ cwd })).toMatch(/^[0-9a-f]{40}$/);
    });
  });

  describe(".getLastTag()", () => {
    it("returns the closest tag", async () => {
      const cwd = await initFixture("basic");

      await execa("git", ["tag", "v1.2.3", "-m", "v1.2.3"], { cwd });

      expect(GitUtilities.getLastTag({ cwd })).toBe("v1.2.3");
    });
  });

  describe(".diffSinceIn()", () => {
    it("omits location filter when location is current working directory", async () => {
      const cwd = await initFixture("basic");
      const file = path.join(cwd, "packages", "pkg-5", "index.js");

      await execa("git", ["tag", "v1.2.3", "-m", "v1.2.3"], { cwd });

      await fs.outputFile(file, "hello");
      await fs.writeJSON(path.join(cwd, "package.json"), { foo: "bar" });

      await execa("git", ["add", "."], { cwd });
      await execa("git", ["commit", "-m", "change"], { cwd });

      const rootDiff = GitUtilities.diffSinceIn("v1.2.3", cwd, { cwd });
      const fileDiff = GitUtilities.diffSinceIn("v1.2.3", path.dirname(file), { cwd });

      expect(rootDiff).toMatch("package.json");
      expect(fileDiff).toBe("packages/pkg-5/index.js");
    });
  });

  describe(".hasCommit()", () => {
    it("returns true when git command succeeds", async () => {
      const cwd = await initFixture("basic");

      expect(GitUtilities.hasCommit({ cwd })).toBe(true);

      await fs.remove(path.join(cwd, ".git"));
      expect(GitUtilities.hasCommit({ cwd })).toBe(false);
    });
  });
});
