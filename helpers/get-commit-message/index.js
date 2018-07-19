"use strict";

const execa = require("execa");

module.exports = getCommitMessage;

function getCommitMessage(cwd, format = "%B") {
  return execa.stdout("git", ["log", "-1", `--pretty=format:${format}`], { cwd });
}
