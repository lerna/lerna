"use strict";

const execa = require("execa");

module.exports = getCommitMessage;

function getCommitMessage(cwd) {
  return execa("git", ["show", "--no-patch", "--pretty=%B"], { cwd }).then(result => result.stdout.trim());
}
