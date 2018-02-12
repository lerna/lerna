"use strict";

const log = require("npmlog");
const path = require("path");

const ChildProcessUtilities = require("../ChildProcessUtilities");
const getOpts = require("./get-npm-exec-opts");

module.exports = runScript;
module.exports.sync = sync;
module.exports.stream = stream;

function runScript(script, { args, npmClient, pkg }, callback) {
  log.silly("npmRunScript", script, args, path.basename(pkg.location));

  return ChildProcessUtilities.exec(npmClient, ["run", script, ...args], getOpts(pkg.location), callback);
}

function sync(script, { args, npmClient, pkg }) {
  log.silly("npmRunScript.sync", script, args, path.basename(pkg.location));

  return ChildProcessUtilities.execSync(npmClient, ["run", script, ...args], getOpts(pkg.location));
}

function stream(script, { args, npmClient, pkg }, callback) {
  log.silly("npmRunScript.stream", [script, args, pkg.name]);

  return ChildProcessUtilities.spawnStreaming(
    npmClient,
    ["run", script, ...args],
    getOpts(pkg.location),
    pkg.name,
    callback
  );
}
