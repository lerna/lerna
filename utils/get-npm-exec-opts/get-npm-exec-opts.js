"use strict";

const log = require("npmlog");

module.exports = getExecOpts;

function getExecOpts(pkg, registry) {
  // execa automatically extends process.env
  const env = {};

  if (registry) {
    env.npm_config_registry = registry;
  }

  log.silly("getExecOpts", pkg.location, registry);
  return {
    cwd: pkg.location,
    env,
    pkg,
  };
}
