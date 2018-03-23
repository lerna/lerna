"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const { EOL } = require("os");
const path = require("path");
const slash = require("slash");
const tempy = require("tempy");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const cloneFixture = require("@lerna-test/clone-fixture")(__dirname);

// file under test
const GitUtilities = require("..");

describe("GitUtilities", () => {
  describe(".isDetachedHead()", () => {
    it("returns true when branchName is HEAD", async () => {
      const cwd = await initFixture("basic");

      expect(GitUtilities.isDetachedHead({ cwd })).toBe(false);

      const sha = await execa.stdout("git", ["rev-parse", "HEAD"], { cwd });
      await execa("git", ["checkout", sha], { cwd }); // detach head

      expect(GitUtilities.isDetachedHead({ cwd })).toBe(true);
    });
  });

  describe(".isInitialized()", () => {
    it("returns true when git command succeeds", async () => {
      const cwd = await initFixture("basic");

      expect(GitUtilities.isInitialized({ cwd })).toBe(true);

      await fs.remove(path.join(cwd, ".git"));
      expect(GitUtilities.isInitialized({ cwd })).toBe(false);
    });
  });

  describe(".addFiles()", () => {
    it("calls git add with files argument", async () => {
      const cwd = await initFixture("basic");
      const file = path.join("packages", "pkg-1", "index.js");

      await fs.outputFile(path.join(cwd, file), "hello");
      await GitUtilities.addFiles([file], { cwd });

      const list = await execa.stdout("git", ["diff", "--cached", "--name-only"], { cwd });
      expect(slash(list)).toBe("packages/pkg-1/index.js");
    });

    it("works with absolute path for files", async () => {
      const cwd = await initFixture("basic");
      const file = path.join(cwd, "packages", "pkg-2", "index.js");

      await fs.outputFile(file, "hello");
      await GitUtilities.addFiles([file], { cwd });

      const list = await execa.stdout("git", ["diff", "--cached", "--name-only"], { cwd });
      expect(slash(list)).toBe("packages/pkg-2/index.js");
    });
  });

  describe(".commit()", () => {
    it("calls git commit with message", async () => {
      const cwd = await initFixture("basic");

      await fs.outputFile(path.join(cwd, "packages", "pkg-3", "index.js"), "hello");
      await execa("git", ["add", "."], { cwd });
      await GitUtilities.commit("foo", { cwd });

      const message = await execa.stdout("git", ["log", "-1", "--pretty=format:%B"], { cwd });
      expect(message).toBe("foo");
    });

    it("allows multiline message", async () => {
      const cwd = await initFixture("basic");

      await fs.outputFile(path.join(cwd, "packages", "pkg-4", "index.js"), "hello");
      await execa("git", ["add", "."], { cwd });
      await GitUtilities.commit(`foo${EOL}${EOL}bar`, { cwd });

      const subject = await execa.stdout("git", ["log", "-1", "--pretty=format:%s"], { cwd });
      const body = await execa.stdout("git", ["log", "-1", "--pretty=format:%b"], { cwd });

      expect(subject).toBe("foo");
      expect(body).toBe("bar");
    });
  });

  describe(".addTag()", () => {
    it("creates annotated git tag", async () => {
      const cwd = await initFixture("basic");

      await GitUtilities.addTag("v1.2.3", { cwd });

      const list = await execa.stdout("git", ["tag", "--list"], { cwd });
      expect(list).toMatch("v1.2.3");
    });
  });

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

  describe(".pushWithTags()", () => {
    it("pushes current branch and specified tag(s) to origin", async () => {
      const { cwd } = await cloneFixture("basic");

      await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
      await execa("git", ["tag", "v1.2.3", "-m", "v1.2.3"], { cwd });

      await GitUtilities.pushWithTags("origin", ["v1.2.3"], { cwd });

      const list = await execa.stdout("git", ["ls-remote", "--tags", "--refs", "--quiet"], { cwd });
      expect(list).toMatch("v1.2.3");
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
      expect(fileDiff).toBe(path.relative(cwd, file));
    });
  });

  describe(".getWorkspaceRoot()", () => {
    it("calls `git rev-parse --show-toplevel`", async () => {
      const topLevel = await initFixture("basic");
      const cwd = path.join(topLevel, "foo");

      await fs.mkdirp(cwd);
      expect(GitUtilities.getWorkspaceRoot({ cwd })).toBe(topLevel);
    });
  });

  describe(".getCurrentBranch()", () => {
    it("calls `git rev-parse --abbrev-ref HEAD`", async () => {
      const cwd = await initFixture("basic");

      expect(GitUtilities.getCurrentBranch({ cwd })).toBe("master");
    });
  });

  describe(".getCurrentSHA()", () => {
    it("returns full SHA of current ref", async () => {
      const cwd = await initFixture("basic");

      expect(GitUtilities.getCurrentSHA({ cwd })).toMatch(/^[0-9a-f]{40}$/);
    });
  });

  describe(".getShortSHA()", () => {
    it("returns short SHA of current ref", async () => {
      const cwd = await initFixture("basic");

      expect(GitUtilities.getShortSHA({ cwd })).toMatch(/^[0-9a-f]{7,8}$/);
    });
  });

  describe(".checkoutChanges()", () => {
    it("calls git checkout with specified arg", async () => {
      const cwd = await initFixture("basic");

      await fs.writeJSON(path.join(cwd, "package.json"), { foo: "bar" });
      await GitUtilities.checkoutChanges("package.json", { cwd });

      const modified = await execa.stdout("git", ["ls-files", "--modified"], { cwd });
      expect(modified).toBe("");
    });
  });

  describe(".init()", () => {
    it("calls git init", async () => {
      const cwd = tempy.directory();

      GitUtilities.init({ cwd });

      const { code } = await execa("git", ["status"], { cwd });
      expect(code).toBe(0);
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

  describe(".isBehindUpstream()", () => {
    it("returns true when behind upstream", async () => {
      const { cwd } = await cloneFixture("basic");

      expect(GitUtilities.isBehindUpstream("origin", { cwd })).toBe(false);

      await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
      await execa("git", ["push", "origin", "master"], { cwd });
      await execa("git", ["reset", "--hard", "HEAD^"], { cwd });

      expect(GitUtilities.isBehindUpstream("origin", { cwd })).toBe(true);
    });
  });
});
