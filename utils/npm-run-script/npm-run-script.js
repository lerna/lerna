"use strict";

const log = require("npmlog");

const ChildProcessUtilities = require("@lerna/child-process");
const getOpts = require("@lerna/get-npm-exec-opts");

module.exports = runScript;
module.exports.stream = stream;

function runScript(script, { args, npmClient, pkg }) {
  log.silly("npmRunScript", script, args, pkg.name);

  return ChildProcessUtilities.exec(npmClient, ["run", script, ...args], getOpts(pkg));
}

function stream(script, { args, npmClient, pkg }) {
  log.silly("npmRunScript.stream", [script, args, pkg.name]);

  return ChildProcessUtilities.spawnStreaming(npmClient, ["run", script, ...args], getOpts(pkg), pkg.name);
}
