import { EOL } from "os";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import GitUtilities from "../src/GitUtilities";

jest.mock("../src/ChildProcessUtilities");

describe("GitUtilities", () => {
  afterEach(() => jest.resetAllMocks());

  describe(".isDetachedHead()", () => {
    const getCurrentBranch = GitUtilities.getCurrentBranch;
    afterEach(() => {
      GitUtilities.getCurrentBranch = getCurrentBranch;
    });

    it("returns true when branchName is HEAD", () => {
      GitUtilities.getCurrentBranch = jest.fn(() => "HEAD");
      expect(GitUtilities.isDetachedHead()).toBe(true);
    });

    it("returns false when branchName is not HEAD", () => {
      GitUtilities.getCurrentBranch = jest.fn(() => "master");
      expect(GitUtilities.isDetachedHead()).toBe(false);
    });
  });

  describe(".isInitialized()", () => {
    it("returns true when git command succeeds", () => {
      expect(GitUtilities.isInitialized()).toBe(true);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git rev-parse", { stdio: "ignore" });
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
      GitUtilities.addFile("foo");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git add foo");
    });
  });

  describe(".commit()", () => {
    it("calls git commit with message", () => {
      GitUtilities.commit("foo");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git commit -m \"$(echo \"foo\")\"");
    });

    it("allows multiline message", () => {
      GitUtilities.commit(`foo${EOL}bar`);
      expect(ChildProcessUtilities.execSync).lastCalledWith(`git commit -m "$(echo "foo${EOL}bar")"`);
    });
  });

  describe(".addTag()", () => {
    it("creates annotated git tag", () => {
      GitUtilities.addTag("foo");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git tag -a foo -m \"foo\"");
    });
  });

  describe(".removeTag()", () => {
    it("deletes specified git tag", () => {
      GitUtilities.removeTag("foo");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git tag -d foo");
    });
  });

  describe(".hasTags()", () => {
    it("returns true when one or more git tags exist", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "v1.0.0");
      expect(GitUtilities.hasTags()).toBe(true);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git tag");
    });

    it("returns false when no git tags exist", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "");
      expect(GitUtilities.hasTags()).toBe(false);
    });
  });

  describe(".getLastTaggedCommit()", () => {
    it("returns SHA of closest git tag", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "deadbeef");
      expect(GitUtilities.getLastTaggedCommit()).toBe("deadbeef");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git rev-list --tags --max-count=1");
    });
  });

  describe(".getLastTaggedCommitInBranch()", () => {
    const getLastTag = GitUtilities.getLastTag;
    afterEach(() => {
      GitUtilities.getLastTag = getLastTag;
    });

    it("returns SHA of closest git tag in branch", () => {
      GitUtilities.getLastTag = jest.fn(() => "v1.0.0");
      ChildProcessUtilities.execSync.mockImplementation(() => "deadbeef");
      expect(GitUtilities.getLastTaggedCommitInBranch()).toBe("deadbeef");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git rev-list -n 1 v1.0.0");
    });
  });

  describe(".getFirstCommit()", () => {
    it("returns SHA of first commit", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "beefcafe");
      expect(GitUtilities.getFirstCommit()).toBe("beefcafe");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git rev-list --max-parents=0 HEAD");
    });
  });

  describe(".pushWithTags()", () => {
    const getCurrentBranch = GitUtilities.getCurrentBranch;
    afterEach(() => {
      GitUtilities.getCurrentBranch = getCurrentBranch;
    });

    it("pushes current branch and specified tag(s) to origin", () => {
      GitUtilities.getCurrentBranch = jest.fn(() => "master");
      GitUtilities.pushWithTags("origin", ["foo@1.0.1", "foo-bar@1.0.0"]);
      expect(ChildProcessUtilities.execSync).toBeCalledWith("git push origin master");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git push origin foo@1.0.1 foo-bar@1.0.0");
    });
  });

  describe(".getLastTag()", () => {
    it("returns the closest tag", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "v1.0.0");
      expect(GitUtilities.getLastTag()).toBe("v1.0.0");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git describe --tags --abbrev=0");
    });
  });

  describe(".describeTag()", () => {
    it("returns description of specified tag", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "foo@1.0.0");
      expect(GitUtilities.describeTag("deadbeef")).toBe("foo@1.0.0");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git describe --tags deadbeef");
    });
  });

  describe(".diffSinceIn()", () => {
    it("returns list of files changed since commit at location", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "files");
      expect(GitUtilities.diffSinceIn("foo@1.0.0", "packages/foo")).toBe("files");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git diff --name-only foo@1.0.0 -- packages/foo");
    });
  });

  describe(".getCurrentBranch()", () => {
    it("calls `git rev-parse --abbrev-ref HEAD`", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "master");
      expect(GitUtilities.getCurrentBranch()).toBe("master");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git rev-parse --abbrev-ref HEAD");
    });
  });

  describe(".getCurrentSHA()", () => {
    it("returns SHA of current ref", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "deadcafe");
      expect(GitUtilities.getCurrentSHA()).toBe("deadcafe");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git rev-parse HEAD");
    });
  });

  describe(".getTopLevelDirectory()", () => {
    it("returns root directory of repo", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "/path/to/foo");
      expect(GitUtilities.getTopLevelDirectory()).toBe("/path/to/foo");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git rev-parse --show-toplevel");
    });
  });

  describe(".checkoutChanges()", () => {
    it("calls git checkout with specified arg", () => {
      GitUtilities.checkoutChanges("packages/*/package.json");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git checkout -- packages/*/package.json");
    });
  });

  describe(".init()", () => {
    it("calls git init", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "stdout for logger");
      expect(GitUtilities.init()).toBe("stdout for logger");
      expect(ChildProcessUtilities.execSync).lastCalledWith("git init");
    });
  });

  describe(".hasCommit()", () => {
    it("returns true when git command succeeds", () => {
      expect(GitUtilities.hasCommit()).toBe(true);
      expect(ChildProcessUtilities.execSync).lastCalledWith("git log");
    });

    it("returns false when git command fails", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => {
        throw new Error("fatal: your current branch 'master' does not have any commits yet");
      });
      expect(GitUtilities.hasCommit()).toBe(false);
    });
  });
});
