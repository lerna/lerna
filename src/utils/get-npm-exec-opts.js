"use strict";

const log = require("npmlog");

module.exports = getExecOpts;

function getExecOpts(pkg, registry) {
  const opts = {
    cwd: pkg.location,
  };

  if (registry) {
    opts.env = Object.assign({}, process.env, {
      npm_config_registry: registry,
    });
  }

  log.silly("getExecOpts", opts);
  return opts;
}
