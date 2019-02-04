"use strict";

const log = require("npmlog");
const runScript = require("npm-lifecycle");
const figgyPudding = require("figgy-pudding");
const npmConf = require("@lerna/npm-conf");

module.exports = runLifecycle;
module.exports.createRunner = createRunner;

const LifecycleConfig = figgyPudding(
  {
    log: { default: log },
    // provide aliases for some dash-cased props
    "ignore-prepublish": {},
    ignorePrepublish: "ignore-prepublish",
    "ignore-scripts": {},
    ignoreScripts: "ignore-scripts",
    "node-options": {},
    nodeOptions: "node-options",
    "script-shell": {},
    scriptShell: "script-shell",
    "scripts-prepend-node-path": {},
    scriptsPrependNodePath: "scripts-prepend-node-path",
    "unsafe-perm": {
      // when running scripts explicitly, assume that they're trusted
      default: true,
    },
    unsafePerm: "unsafe-perm",
  },
  {
    other() {
      // open up the pudding
      return true;
    },
  }
);

function runLifecycle(pkg, stage, _opts) {
  // back-compat for @lerna/npm-conf instances
  // https://github.com/isaacs/proto-list/blob/27764cd/proto-list.js#L14
  if ("root" in _opts) {
    // eslint-disable-next-line no-param-reassign
    _opts = _opts.snapshot;
  }

  const opts = LifecycleConfig(_opts);
  const dir = pkg.location;
  const config = {};

  if (opts.ignoreScripts) {
    opts.log.verbose("lifecycle", "%j ignored in %j", stage, pkg.name);

    return Promise.resolve();
  }

  if (!pkg.scripts || !pkg.scripts[stage]) {
    opts.log.silly("lifecycle", "No script for %j in %j, continuing", stage, pkg.name);

    return Promise.resolve();
  }

  if (stage === "prepublish" && opts.ignorePrepublish) {
    opts.log.verbose("lifecycle", "%j ignored in %j", stage, pkg.name);

    return Promise.resolve();
  }

  // https://github.com/zkat/figgy-pudding/blob/7d68bd3/index.js#L42-L64
  for (const [key, val] of opts) {
    // omit falsy values and circular objects
    if (val != null && key !== "log" && key !== "logstream") {
      config[key] = val;
    }
  }

  /* istanbul ignore else */
  // eslint-disable-next-line no-underscore-dangle
  if (pkg.__isLernaPackage) {
    // To ensure npm-lifecycle creates the correct npm_package_* env vars,
    // we must pass the _actual_ JSON instead of our fancy Package thingy
    // eslint-disable-next-line no-param-reassign
    pkg = pkg.toJSON();
  }

  // TODO: remove pkg._id when npm-lifecycle no longer relies on it
  pkg._id = `${pkg.name}@${pkg.version}`; // eslint-disable-line

  opts.log.silly("lifecycle", "%j starting in %j", stage, pkg.name);

  return runScript(pkg, stage, dir, {
    config,
    dir,
    failOk: false,
    log: opts.log,
    // bring along camelCased aliases
    nodeOptions: opts.nodeOptions,
    scriptShell: opts.scriptShell,
    scriptsPrependNodePath: opts.scriptsPrependNodePath,
    unsafePerm: opts.unsafePerm,
  }).then(
    () => {
      opts.log.silly("lifecycle", "%j finished in %j", stage, pkg.name);
    },
    err => {
      // propagate the exit code
      const exitCode = err.errno || 1;

      // error logging has already occurred on stderr, but we need to stop the chain
      log.error("lifecycle", "%j errored in %j, exiting %d", stage, pkg.name, exitCode);

      // ensure clean logging, avoiding spurious log dump
      err.name = "ValidationError";

      // our yargs.fail() handler expects a numeric .code, not .errno
      err.code = exitCode;
      process.exitCode = exitCode;

      // stop the chain
      throw err;
    }
  );
}

function createRunner(commandOptions) {
  const cfg = npmConf(commandOptions).snapshot;

  return (pkg, stage) => runLifecycle(pkg, stage, cfg);
}
