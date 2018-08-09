"use strict";

const execa = require("execa");

const LERNA_BIN = require.resolve("../../core/lerna/cli");

module.exports = runner;

function runner(cwd, env) {
  const opts = {
    cwd,
    env: Object.assign({ CI: "true" }, env),
    // when debugging integration test snapshots, uncomment next line
    // stdio: ["ignore", "inherit", "inherit"],
  };

  return (...args) => execa("node", [LERNA_BIN].concat(args), opts);
}
