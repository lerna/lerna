"use strict";

const normalizeNewline = require("normalize-newline");
const serializeGitSHA = require("@lerna-test/serialize-git-sha");

// expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));
module.exports = {
  print(val) {
    return serializeGitSHA
      .print(normalizeNewline(val))
      .replace(/\(http.*\/commits\/SHA\)/g, "(COMMIT_URL)")
      .replace(/\(\d{4}-\d{2}-\d{2}\)/g, "(YYYY-MM-DD)");
  },
  test(val) {
    return val && typeof val === "string";
  },
};
