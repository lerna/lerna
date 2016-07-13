import assert from "assert";

import GitUtilities from "../src/GitUtilities";

/**
 * Yes, I am aware that these aren't actually tests.
 * Please write them for me if it bothers you enough.
 */

describe("GitUtilities", () => {
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
