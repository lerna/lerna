"use strict";

const execa = require("execa");

module.exports = gitMerge;

function gitMerge(cwd, args) {
  return execa("git", ["merge", ...args], { cwd });
}
