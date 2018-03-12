"use strict";

const execa = require("execa");

module.exports = gitAdd;

function gitAdd(cwd, ...files) {
  return execa("git", ["add", ...files], { cwd });
}
