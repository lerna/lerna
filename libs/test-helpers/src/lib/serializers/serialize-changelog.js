"use strict";

const normalizeNewline = require("normalize-newline");
const gitSHA = require("./serialize-git-sha");

// expect.addSnapshotSerializer(require("./serialize-changelog"));
module.exports = {
  serialize(str) {
    return gitSHA
      .serialize(normalizeNewline(str))
      .replace(/(\[.*?\])\(.*\/compare\/(.*?)\)/g, "$1(/compare/$2)")
      .replace(/(\[.*?\])\(.*\/commit(s?)\/GIT_HEAD\)/g, "$1(COMMIT_URL)")
      .replace(/\(\d{4}-\d{2}-\d{2}\)/g, "(YYYY-MM-DD)");
  },
  test(val) {
    return val != null && typeof val === "string";
  },
};
