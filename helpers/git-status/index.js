"use strict";

const execa = require("execa");

module.exports = gitStatus;

function gitStatus(cwd) {
  return execa("git", ["status"], { cwd });
}
