"use strict";

const log = require("npmlog");

const ChildProcessUtilities = require("@lerna/child-process");
const getOpts = require("@lerna/get-npm-exec-opts");

module.exports = runScript;
module.exports.stream = stream;

function runScript(script, { args, npmClient, pkg, reject = true }) {
  log.silly("npmRunScript", script, args, pkg.name);

  const argv = ["run", script, ...args];
  const opts = makeOpts(pkg, reject);

  return ChildProcessUtilities.exec(npmClient, argv, opts);
}

function stream(script, { args, npmClient, pkg, prefix, reject = true }) {
  log.silly("npmRunScript.stream", [script, args, pkg.name]);

  const argv = ["run", script, ...args];
  const opts = makeOpts(pkg, reject);

  return ChildProcessUtilities.spawnStreaming(npmClient, argv, opts, prefix && pkg.name);
}

function makeOpts(pkg, reject) {
  return Object.assign(getOpts(pkg), {
    reject,
  });
}
