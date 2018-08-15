"use strict";

const execa = require("execa");
const gitSHA = require("@lerna-test/serialize-git-sha");

module.exports = showCommit;

function showCommit(cwd, ...args) {
  return execa
    .stdout(
      "git",
      [
        "show",
        "--unified=0",
        "--ignore-space-at-eol",
        "--pretty=%B%+D",
        // make absolutely certain that no OS localization
        // changes the expected value of the path prefixes
        "--src-prefix=a/",
        "--dst-prefix=b/",
        ...args,
      ],
      { cwd }
    )
    .then(stdout => gitSHA.serialize(stdout));
}
