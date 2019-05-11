"use strict";

const execa = require("execa");

// eslint-disable-next-line node/no-unpublished-require
const LERNA_BIN = require.resolve("../../core/lerna/cli");

module.exports = runner;

function runner(cwd, env) {
  const opts = {
    cwd,
    env: Object.assign(
      {
        CI: "true",
        // always turn off chalk
        FORCE_COLOR: "0",
      },
      env
    ),
    // when debugging integration test snapshots, uncomment next line
    // stdio: ["ignore", "inherit", "inherit"],
  };

  return (...args) => execa("node", [LERNA_BIN].concat(args), opts);
}
