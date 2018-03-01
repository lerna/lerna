"use strict";

const log = require("npmlog");
const npmLifecycle = require("npm-lifecycle");

module.exports = lifecycle;

function lifecycle(pkg, script, conf, logger) {
  logger.silly("lifecycle", script, pkg.name);

  const tracker = logger.newItem(script);
  tracker.level = log.level;

  const opts = {
    dir: pkg.location,
    config: {},
    log: tracker,
    unsafePerm: true,
  };

  conf.forEach((key, val) => {
    if (val != null) {
      opts.config[key] = val;
    }
  });

  // TODO: remove pkg._id when npm-lifecycle no longer relies on it
  pkg._id = `${pkg.name}@${pkg.version}`; // eslint-disable-line

  return npmLifecycle(pkg, script, pkg.location, opts).then(() => {
    tracker.finish();
  });
}
