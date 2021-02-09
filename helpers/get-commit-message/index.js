"use strict";

const execa = require("execa");

module.exports.getCommitMessage = getCommitMessage;

function getCommitMessage(cwd, format = "%B") {
  return execa("git", ["log", "-1", `--pretty=format:${format}`], { cwd }).then((result) => result.stdout);
}
