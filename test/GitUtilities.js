import { EOL } from "os";
import path from "path";

// mocked modules
import tempWrite from "temp-write";
import ChildProcessUtilities from "../src/ChildProcessUtilities";

// file under test
import GitUtilities from "../src/GitUtilities";

jest.mock("temp-write");
jest.mock("../src/ChildProcessUtilities");

describe("GitUtilities", () => {
  afterEach(() => jest.resetAllMocks());

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
      GitUtilities.getCurrentBranch = jest.fn();
      const opts = { cwd: "test" };
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
      ChildProcessUtilities.execSync.mockImplementation(() => {
        throw new Error("fatal: Not a git repository");
      });
      expect(() => GitUtilities.isInitialized()).not.toThrow();
      expect(GitUtilities.isInitialized()).toBe(false);
    });
  });

  describe(".addFile()", () => {
    it("calls git add with file argument", () => {
      const opts = { cwd: "test" };
      GitUtilities.addFile("foo", opts);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["add", "foo"], opts);
    });
    it("works with absolute path for cwd", () => {
      const cwd = path.resolve("test");
      const file = "foo";
      const opts = { cwd };
      GitUtilities.addFile(file, opts);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["add", "foo"], opts);
    });
    it("works with absolute paths for file and cwd", () => {
      const cwd = path.resolve("test");
      const file = path.resolve(cwd, "foo");
      const opts = { cwd };
      GitUtilities.addFile(file, opts);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["add", "foo"], opts);
    });
    it("uses a POSIX path in the Git command, given a Windows file path", () => {
      const opts = { cwd: "test" };
      GitUtilities.addFile("foo\\bar", opts);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["add", "foo/bar"], opts);
    });
  });

  describe(".commit()", () => {
    it("calls git commit with message", () => {
      const opts = { cwd: "oneline" };
      GitUtilities.commit("foo", opts);

      expect(ChildProcessUtilities.execSync).lastCalledWith(
        "git",
        ["commit", "--no-verify", "-m", "foo"],
        opts
      );
      expect(tempWrite.sync).not.toBeCalled();
    });

    it("allows multiline message", () => {
      tempWrite.sync = jest.fn(() => "TEMPFILE");

      const opts = { cwd: "multiline" };
      GitUtilities.commit(`foo${EOL}bar`, opts);

      expect(ChildProcessUtilities.execSync).lastCalledWith(
        "git",
        ["commit", "--no-verify", "-F", "TEMPFILE"],
        opts
      );
      expect(tempWrite.sync).lastCalledWith(`foo${EOL}bar`, "lerna-commit.txt");
    });
  });

  describe(".addTag()", () => {
    it("creates annotated git tag", () => {
      const opts = { cwd: "test" };
      GitUtilities.addTag("foo", opts);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["tag", "foo", "-m", "foo"], opts);
    });
  });

  describe(".removeTag()", () => {
    it("deletes specified git tag", () => {
      const opts = { cwd: "test" };
      GitUtilities.removeTag("foo", opts);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["tag", "-d", "foo"], opts);
    });
  });

  describe(".hasTags()", () => {
    it("returns true when one or more git tags exist", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "v1.0.0");
      const opts = { cwd: "test" };
      expect(GitUtilities.hasTags(opts)).toBe(true);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["tag"], opts);
    });

    it("returns false when no git tags exist", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "");
      expect(GitUtilities.hasTags()).toBe(false);
    });
  });

  describe(".getLastTaggedCommit()", () => {
    it("returns SHA of closest git tag", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "deadbeef");
      const opts = { cwd: "test" };
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
      GitUtilities.getLastTag = jest.fn(() => "v1.0.0");
      ChildProcessUtilities.execSync.mockImplementation(() => "deadbeef");
      const opts = { cwd: "test" };
      expect(GitUtilities.getLastTaggedCommitInBranch(opts)).toBe("deadbeef");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["rev-list", "-n", "1", "v1.0.0"], opts);
    });
  });

  describe(".getFirstCommit()", () => {
    it("returns SHA of first commit", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "beefcafe");
      const opts = { cwd: "test" };
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

    it("pushes current branch and specified tag(s) to origin", () => {
      GitUtilities.getCurrentBranch = jest.fn(() => "master");
      const opts = { cwd: "test" };
      GitUtilities.pushWithTags("origin", ["foo@1.0.1", "foo-bar@1.0.0"], opts);
      expect(ChildProcessUtilities.execSync).lastCalledWith(
        "git",
        ["push", "--no-verify", "origin", "master", "foo@1.0.1", "foo-bar@1.0.0"],
        opts
      );
    });
  });

  describe(".getLastTag()", () => {
    it("returns the closest tag", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "v1.0.0");
      const opts = { cwd: "test" };
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
      ChildProcessUtilities.execSync.mockImplementation(() => "foo@1.0.0");
      const opts = { cwd: "test" };
      expect(GitUtilities.describeTag("deadbeef", opts)).toBe("foo@1.0.0");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["describe", "--tags", "deadbeef"], opts);
    });
  });

  describe(".diffSinceIn()", () => {
    it("returns list of files changed since commit at location", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "files");
      const opts = { cwd: path.resolve(__dirname, "./..") };
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
      ChildProcessUtilities.execSync.mockImplementation(() => "master");
      const opts = { cwd: "test" };
      expect(GitUtilities.getWorkspaceRoot(opts)).toBe("master");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["rev-parse", "--show-toplevel"], opts);
    });
  });

  describe(".getCurrentBranch()", () => {
    it("calls `git rev-parse --abbrev-ref HEAD`", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "master");
      const opts = { cwd: "test" };
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
      ChildProcessUtilities.execSync.mockImplementation(() => "deadcafe");
      const opts = { cwd: "test" };
      expect(GitUtilities.getCurrentSHA(opts)).toBe("deadcafe");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git", ["rev-parse", "HEAD"], opts);
    });
  });

  describe(".checkoutChanges()", () => {
    it("calls git checkout with specified arg", () => {
      const opts = { cwd: "test" };
      GitUtilities.checkoutChanges("packages/*/package.json", opts);
      expect(ChildProcessUtilities.execSync).lastCalledWith(
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
      ChildProcessUtilities.execSync.mockImplementation(() => {
        throw new Error("fatal: your current branch 'master' does not have any commits yet");
      });
      expect(GitUtilities.hasCommit()).toBe(false);
    });
  });
});
