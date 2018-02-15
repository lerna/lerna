"use strict";

const { EOL } = require("os");
const path = require("path");

// mocked modules
const tempWrite = require("temp-write");
const ChildProcessUtilities = require("../src/ChildProcessUtilities");

// file under test
const GitUtilities = require("../src/GitUtilities");

jest.mock("temp-write");
jest.mock("../src/ChildProcessUtilities");

describe("GitUtilities", () => {
  ChildProcessUtilities.exec.mockResolvedValue();

  afterEach(jest.clearAllMocks);

  describe(".isDetachedHead()", () => {
    const originalGetCurrentBranch = GitUtilities.getCurrentBranch;

    afterEach(() => {
      GitUtilities.getCurrentBranch = originalGetCurrentBranch;
    });

    it("returns true when branchName is HEAD", () => {
      GitUtilities.getCurrentBranch = jest.fn(() => "HEAD");

      expect(GitUtilities.isDetachedHead()).toBe(true);
    });

    it("returns false when branchName is not HEAD", () => {
      GitUtilities.getCurrentBranch = jest.fn(() => "master");

      expect(GitUtilities.isDetachedHead()).toBe(false);
    });

    it("passes opts to getCurrentBranch()", () => {
      const opts = { cwd: "test" };

      GitUtilities.getCurrentBranch = jest.fn();

      GitUtilities.isDetachedHead(opts);
      expect(GitUtilities.getCurrentBranch).lastCalledWith(opts);
    });
  });

  describe(".isInitialized()", () => {
    it("returns true when git command succeeds", () => {
      expect(GitUtilities.isInitialized({ cwd: "test" })).toBe(true);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["rev-parse"], {
        cwd: "test",
        stdio: "ignore",
      });
    });

    it("returns false when git command fails", () => {
      ChildProcessUtilities.execSync.mockImplementationOnce(() => {
        throw new Error("fatal: Not a git repository");
      });

      expect(GitUtilities.isInitialized()).toBe(false);
    });
  });

  describe(".addFiles()", () => {
    it("calls git add with files argument", async () => {
      const opts = { cwd: "test" };

      await GitUtilities.addFiles(["foo", "bar"], opts);

      expect(ChildProcessUtilities.exec).lastCalledWith("git", ["add", "--", "foo", "bar"], opts);
    });

    it("works with absolute path for cwd", async () => {
      const cwd = path.resolve("test");
      const file = "foo";
      const opts = { cwd };

      await GitUtilities.addFiles([file], opts);

      expect(ChildProcessUtilities.exec).lastCalledWith("git", ["add", "--", "foo"], opts);
    });

    it("works with absolute paths for file and cwd", async () => {
      const cwd = path.resolve("test");
      const file = path.resolve(cwd, "foo");
      const opts = { cwd };

      await GitUtilities.addFiles([file], opts);

      expect(ChildProcessUtilities.exec).lastCalledWith("git", ["add", "--", "foo"], opts);
    });

    it("uses a POSIX path in the Git command, given a Windows file path", async () => {
      const opts = { cwd: "test" };

      await GitUtilities.addFiles(["foo\\bar"], opts);

      expect(ChildProcessUtilities.exec).lastCalledWith("git", ["add", "--", "foo/bar"], opts);
    });
  });

  describe(".commit()", () => {
    it("calls git commit with message", async () => {
      const opts = { cwd: "oneline" };

      await GitUtilities.commit("foo", opts);

      expect(ChildProcessUtilities.exec).lastCalledWith("git", ["commit", "--no-verify", "-m", "foo"], opts);
      expect(tempWrite.sync).not.toBeCalled();
    });

    it("allows multiline message", async () => {
      const opts = { cwd: "multiline" };

      tempWrite.sync = jest.fn(() => "TEMPFILE");

      await GitUtilities.commit(`foo${EOL}bar`, opts);
      expect(ChildProcessUtilities.exec).lastCalledWith(
        "git",
        ["commit", "--no-verify", "-F", "TEMPFILE"],
        opts
      );
      expect(tempWrite.sync).lastCalledWith(`foo${EOL}bar`, "lerna-commit.txt");
    });
  });

  describe(".addTag()", () => {
    it("creates annotated git tag", async () => {
      const opts = { cwd: "test" };
      await GitUtilities.addTag("foo", opts);
      expect(ChildProcessUtilities.exec).lastCalledWith("git", ["tag", "foo", "-m", "foo"], opts);
    });
  });

  describe(".hasTags()", () => {
    it("returns true when one or more git tags exist", () => {
      const opts = { cwd: "test" };

      ChildProcessUtilities.execSync.mockReturnValueOnce("v1.0.0");

      expect(GitUtilities.hasTags(opts)).toBe(true);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["tag"], opts);
    });

    it("returns false when no git tags exist", () => {
      ChildProcessUtilities.execSync.mockReturnValueOnce("");

      expect(GitUtilities.hasTags()).toBe(false);
    });
  });

  describe(".getLastTaggedCommit()", () => {
    it("returns SHA of closest git tag", () => {
      const opts = { cwd: "test" };

      ChildProcessUtilities.execSync.mockReturnValueOnce("deadbeef");

      expect(GitUtilities.getLastTaggedCommit(opts)).toBe("deadbeef");
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        "git",
        ["rev-list", "--tags", "--max-count=1"],
        opts
      );
    });
  });

  describe(".getLastTaggedCommitInBranch()", () => {
    const getLastTagOriginal = GitUtilities.getLastTag;

    afterEach(() => {
      GitUtilities.getLastTag = getLastTagOriginal;
    });

    it("returns SHA of closest git tag in branch", () => {
      const opts = { cwd: "test" };

      GitUtilities.getLastTag = jest.fn(() => "v1.0.0");
      ChildProcessUtilities.execSync.mockReturnValueOnce("deadbeef");

      expect(GitUtilities.getLastTaggedCommitInBranch(opts)).toBe("deadbeef");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["rev-list", "-n", "1", "v1.0.0"], opts);
    });
  });

  describe(".getFirstCommit()", () => {
    it("returns SHA of first commit", () => {
      const opts = { cwd: "test" };

      ChildProcessUtilities.execSync.mockReturnValueOnce("beefcafe");

      expect(GitUtilities.getFirstCommit(opts)).toBe("beefcafe");
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        "git",
        ["rev-list", "--max-parents=0", "HEAD"],
        opts
      );
    });
  });

  describe(".pushWithTags()", () => {
    const getCurrentBranchOriginal = GitUtilities.getCurrentBranch;
    afterEach(() => {
      GitUtilities.getCurrentBranch = getCurrentBranchOriginal;
    });

    it("pushes current branch and specified tag(s) to origin", async () => {
      const opts = { cwd: "test" };

      GitUtilities.getCurrentBranch = jest.fn(() => "master");

      await GitUtilities.pushWithTags("origin", ["foo@1.0.1", "foo-bar@1.0.0"], opts);
      expect(ChildProcessUtilities.exec).toBeCalledWith("git", ["push", "origin", "master"], opts);
      expect(ChildProcessUtilities.exec).lastCalledWith(
        "git",
        ["push", "origin", "foo@1.0.1", "foo-bar@1.0.0"],
        opts
      );
    });
  });

  describe(".getLastTag()", () => {
    it("returns the closest tag", () => {
      const opts = { cwd: "test" };

      ChildProcessUtilities.execSync.mockReturnValueOnce("v1.0.0");

      expect(GitUtilities.getLastTag(opts)).toBe("v1.0.0");
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        "git",
        ["describe", "--tags", "--abbrev=0"],
        opts
      );
    });
  });

  describe(".describeTag()", () => {
    it("returns description of specified tag", () => {
      const opts = { cwd: "test" };

      ChildProcessUtilities.execSync.mockReturnValueOnce("foo@1.0.0");

      expect(GitUtilities.describeTag("deadbeef", opts)).toBe("foo@1.0.0");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["describe", "--tags", "deadbeef"], opts);
    });
  });

  describe(".diffSinceIn()", () => {
    it("returns list of files changed since commit at location", () => {
      const opts = { cwd: path.resolve(__dirname, "./..") };

      ChildProcessUtilities.execSync.mockReturnValueOnce("files");

      expect(GitUtilities.diffSinceIn("foo@1.0.0", "packages/foo", opts)).toBe("files");
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        "git",
        ["diff", "--name-only", "foo@1.0.0", "--", "packages/foo"],
        opts
      );
    });
  });

  describe(".getWorkspaceRoot()", () => {
    it("calls `git rev-parse --show-toplevel`", () => {
      const opts = { cwd: "test" };

      ChildProcessUtilities.execSync.mockReturnValueOnce("master");

      expect(GitUtilities.getWorkspaceRoot(opts)).toBe("master");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["rev-parse", "--show-toplevel"], opts);
    });
  });

  describe(".getCurrentBranch()", () => {
    it("calls `git rev-parse --abbrev-ref HEAD`", () => {
      const opts = { cwd: "test" };

      ChildProcessUtilities.execSync.mockReturnValueOnce("master");

      expect(GitUtilities.getCurrentBranch(opts)).toBe("master");
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        "git",
        ["rev-parse", "--abbrev-ref", "HEAD"],
        opts
      );
    });
  });

  describe(".getCurrentSHA()", () => {
    it("returns SHA of current ref", () => {
      const opts = { cwd: "test" };

      ChildProcessUtilities.execSync.mockReturnValueOnce("deadcafe");

      expect(GitUtilities.getCurrentSHA(opts)).toBe("deadcafe");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["rev-parse", "HEAD"], opts);
    });
  });

  describe(".getShortSHA()", () => {
    it("returns short SHA of current ref", () => {
      const opts = { cwd: "test" };

      ChildProcessUtilities.execSync.mockReturnValueOnce("deadbee");

      expect(GitUtilities.getShortSHA(opts)).toBe("deadbee");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["rev-parse", "--short", "HEAD"], opts);
    });
  });

  describe(".checkoutChanges()", () => {
    it("calls git checkout with specified arg", async () => {
      const opts = { cwd: "test" };

      await GitUtilities.checkoutChanges("packages/*/package.json", opts);
      expect(ChildProcessUtilities.exec).lastCalledWith(
        "git",
        ["checkout", "--", "packages/*/package.json"],
        opts
      );
    });
  });

  describe(".init()", () => {
    it("calls git init", () => {
      const opts = { cwd: "test" };

      GitUtilities.init(opts);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["init"], opts);
    });
  });

  describe(".hasCommit()", () => {
    it("returns true when git command succeeds", () => {
      const opts = { cwd: "test" };

      expect(GitUtilities.hasCommit(opts)).toBe(true);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["log"], opts);
    });

    it("returns false when git command fails", () => {
      ChildProcessUtilities.execSync.mockImplementationOnce(() => {
        throw new Error("fatal: your current branch 'master' does not have any commits yet");
      });

      expect(GitUtilities.hasCommit()).toBe(false);
    });
  });
});
