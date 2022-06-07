"use strict";

const log = require("npmlog");

const childProcess = require("@lerna/child-process");
const { getNpmExecOpts } = require("@lerna/get-npm-exec-opts");

module.exports.npmRunScript = npmRunScript;
module.exports.npmRunScriptStreaming = npmRunScriptStreaming;

function npmRunScript(script, { args, npmClient, pkg, reject = true }) {
  log.silly("npmRunScript", script, args, pkg.name);

  const argv = ["run", script, ...args];
  const opts = makeOpts(pkg, reject);

  return childProcess.exec(npmClient, argv, opts);
}

function npmRunScriptStreaming(script, { args, npmClient, pkg, prefix, reject = true }) {
  log.silly("npmRunScriptStreaming", [script, args, pkg.name]);

  const argv = ["run", script, ...args];
  const opts = makeOpts(pkg, reject);

  return childProcess.spawnStreaming(npmClient, argv, opts, prefix && pkg.name);
}

function makeOpts(pkg, reject) {
  return Object.assign(getNpmExecOpts(pkg), {
    windowsHide: false,
    reject,
  });
}
