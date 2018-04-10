"use strict";

// expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));
module.exports = {
  print(val) {
    return (
      val
        // short SHA tends to be in the path diff comparisons
        .replace(/\b[0-9a-f]{7,8}\b/g, "SHA")
        // full SHA corresponds to gitHead property in package.json files
        .replace(/\b[0-9a-f]{40}\b/g, "GIT_HEAD")
    );
  },
  test(val) {
    return val && typeof val === "string";
  },
};
