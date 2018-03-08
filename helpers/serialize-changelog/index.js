"use strict";

const normalizeNewline = require("normalize-newline");

// expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));
module.exports = {
  print(val) {
    return normalizeNewline(val)
      .replace(/\b[0-9a-f]{7,8}\b/g, "SHA")
      .replace(/\b[0-9a-f]{40}\b/g, "GIT_HEAD")
      .replace(/\(\d{4}-\d{2}-\d{2}\)/g, "(YYYY-MM-DD)");
  },
  test(val) {
    return val && typeof val === "string";
  },
};
