"use strict";

const log = require("npmlog");
const npmLifecycle = require("npm-lifecycle");

module.exports = lifecycle;

function lifecycle(pkg, script, opts) {
  log.silly("npm-lifecycle", script, pkg.name);

  const config = {};
  const dir = pkg.location;

  // https://github.com/isaacs/proto-list/blob/27764cd/proto-list.js#L29
  for (const key of opts.keys) {
    const val = opts.get(key);

    if (val != null) {
      config[key] = val;
    }
  }

  // TODO: remove pkg._id when npm-lifecycle no longer relies on it
  pkg._id = `${pkg.name}@${pkg.version}`; // eslint-disable-line

  return npmLifecycle(pkg, script, dir, {
    config,
    dir,
    failOk: false,
    log,
    unsafePerm: true,
  });
}
