"use strict";

const log = require("npmlog");

module.exports = getExecOpts;

function getExecOpts(pkg, registry) {
  const opts = {
    cwd: pkg.location,
  };

  if (pkg.repositoryRootPath) {
    opts.env = {
      LERNA_ROOT_PATH: pkg.repositoryRootPath,
    };
  }

  if (registry) {
    opts.extendEnv = false;
    opts.env = Object.assign({}, process.env, opts.env, {
      npm_config_registry: registry,
    });
  }

  log.silly("getExecOpts", opts);
  return opts;
}
