"use strict";

const path = require("path");
const execa = require("execa");

// Contains all relevant git config (user, commit.gpgSign, etc)
const TEMPLATE = path.resolve(__dirname, "template");

module.exports = gitInit;

function gitInit(cwd, ...args) {
  return execa("git", ["init", "--template", TEMPLATE, ...args], { cwd }).then(() =>
    execa("git", ["branch", "-M", "master", "main"], { cwd }).catch(() => {
      /* ignore, we're on a modern git that respects init.defaultBranch */
    })
  );
}
