"use strict";

const log = require("npmlog");

module.exports.getNpmExecOpts = getNpmExecOpts;

function getNpmExecOpts(pkg, registry) {
  // execa automatically extends process.env
  const env = {
    LERNA_PACKAGE_NAME: pkg.name,
  };

  if (registry) {
    env.npm_config_registry = registry;
  }

  log.silly("getNpmExecOpts", pkg.location, registry);
  return {
    cwd: pkg.location,
    env,
    pkg,
  };
}
