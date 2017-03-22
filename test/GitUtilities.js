import assert from "assert";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import GitUtilities from "../src/GitUtilities";

/**
 * Yes, I am aware that these aren't actually tests.
 * Please write them for me if it bothers you enough.
 */

describe("GitUtilities", () => {
  const cpuExecSync = ChildProcessUtilities.execSync;

  beforeEach(() => {
    ChildProcessUtilities.execSync = jest.fn();
  });

  afterEach(() => {
    ChildProcessUtilities.execSync = cpuExecSync;
  });

  describe(".isDetachedHead()", () => {
    it("calls getCurrentBranch()", () => {
      expect(() => GitUtilities.isDetachedHead()).not.toThrow();
      expect(ChildProcessUtilities.execSync).lastCalledWith("git rev-parse --abbrev-ref HEAD");
    });

    it("returns true when branchName is HEAD", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "HEAD");
      expect(GitUtilities.isDetachedHead()).toBe(true);
    });

    it("returns false when branchName is not HEAD", () => {
      ChildProcessUtilities.execSync.mockImplementation(() => "master");
      expect(GitUtilities.isDetachedHead()).toBe(false);
    });
  });

  describe(".isInitialized()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.isInitialized);
    });
  });

  describe(".addFile()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.addFile);
    });
  });

  describe(".commit()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.commit);
    });
  });

  describe(".addTag()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.addTag);
    });
  });

  describe(".removeTag()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.removeTag);
    });
  });

  describe(".hasTags()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.hasTags);
    });
  });

  describe(".getLastTaggedCommit()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.getLastTaggedCommit);
    });
  });

  describe(".getLastTaggedCommitInBranch()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.getLastTaggedCommitInBranch);
    });
  });

  describe(".getFirstCommit()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.getFirstCommit);
    });
  });

  describe(".pushWithTags()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.pushWithTags);
    });
  });

  describe(".getLastTag()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.getLastTag);
    });
  });

  describe(".describeTag()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.describeTag);
    });
  });

  describe(".diffSinceIn()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.diffSinceIn);
    });
  });

  describe(".getCurrentBranch()", () => {
    it("calls `git rev-parse --abbrev-ref HEAD`", () => {
      expect(() => GitUtilities.getCurrentBranch()).not.toThrow();
      expect(ChildProcessUtilities.execSync).lastCalledWith("git rev-parse --abbrev-ref HEAD");
    });
  });

  describe(".getCurrentSHA()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.getCurrentSHA);
    });
  });

  describe(".getTopLevelDirectory()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.getTopLevelDirectory);
    });
  });

  describe(".checkoutChanges()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.checkoutChanges);
    });
  });

  describe(".init()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.init);
    });
  });

  describe(".hasCommit()", () => {
    it("should exist", () => {
      assert.ok(GitUtilities.hasCommit);
    });
  });
});
