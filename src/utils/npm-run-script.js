"use strict";

const log = require("npmlog");
const path = require("path");

const ChildProcessUtilities = require("../ChildProcessUtilities");
const getOpts = require("./get-npm-exec-opts");

module.exports = runScript;
module.exports.stream = stream;

function runScript(script, { args, npmClient, pkg }, callback) {
  log.silly("npmRunScript", script, args, path.basename(pkg.location));

  return ChildProcessUtilities.exec(npmClient, ["run", script, ...args], getOpts(pkg.location), callback);
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
