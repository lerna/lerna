"use strict";

const execa = require("execa");
const gitSHA = require("@lerna-test/serialize-git-sha");

module.exports = showCommit;

function showCommit(cwd, ...args) {
  return execa
    .stdout("git", ["show", "--unified=0", "--ignore-space-at-eol", "--pretty=%B%+D", ...args], { cwd })
    .then(stdout => gitSHA.serialize(stdout));
}
