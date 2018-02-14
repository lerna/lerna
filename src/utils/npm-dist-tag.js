"use strict";

const log = require("npmlog");

const ChildProcessUtilities = require("../ChildProcessUtilities");
const getExecOpts = require("./get-npm-exec-opts");

exports.add = add;
exports.check = check;
exports.remove = remove;

function add(pkg, version, tag, registry) {
  log.silly("npmDistTag.add", tag, version, pkg.name);

  return ChildProcessUtilities.exec(
    "npm",
    ["dist-tag", "add", `${pkg.name}@${version}`, tag],
    getExecOpts(pkg.location, registry)
  );
}

function check(pkg, tag, registry) {
  log.silly("npmDistTag.check", tag, pkg.name);

  const result = ChildProcessUtilities.execSync(
    "npm",
    ["dist-tag", "ls", pkg.name],
    getExecOpts(pkg.location, registry)
  );

  return result.indexOf(tag) >= 0;
}

function remove(pkg, tag, registry) {
  log.silly("npmDistTag.remove", tag, pkg.name);

  return ChildProcessUtilities.exec(
    "npm",
    ["dist-tag", "rm", pkg.name, tag],
    getExecOpts(pkg.location, registry)
  );
}
