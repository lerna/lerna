"use strict";

const cp = require("child_process");

module.exports.gitStatus = gitStatus;

function gitStatus(cwd) {
  return cp.spawnSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" });
}
