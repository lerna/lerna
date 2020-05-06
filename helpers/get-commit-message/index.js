"use strict";

const execa = require("execa");

module.exports = getCommitMessage;

async function getCommitMessage(cwd, format = "%B") {
  const { stdout } = await execa("git", ["log", "-1", `--pretty=format:${format}`], { cwd });
  return stdout;
}
