"use strict";

const execa = require("execa");

module.exports = gitInit;

function gitInit(cwd, ...args) {
  return execa("git", ["init", ...args], { cwd }).then(() =>
    execa("git", ["config", "commit.gpgSign", "false"], { cwd })
  );
}
