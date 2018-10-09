"use strict";

const execa = require("execa");

module.exports = gitCheckout;

function gitCheckout(cwd, args) {
  return execa("git", ["checkout", ...args], { cwd });
}
