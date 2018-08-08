"use strict";

const log = require("npmlog");

const ChildProcessUtilities = require("@lerna/child-process");
const getExecOpts = require("@lerna/get-npm-exec-opts");

exports.add = add;
exports.check = check;
exports.remove = remove;

function add(pkg, tag, { registry }) {
  log.silly("npmDistTag.add", tag, pkg.version, pkg.name);

  return ChildProcessUtilities.exec(
    "npm",
    ["dist-tag", "add", `${pkg.name}@${pkg.version}`, tag],
    getExecOpts(pkg, registry)
  );
}

function check(pkg, tag, { registry }) {
  log.silly("npmDistTag.check", tag, pkg.name);

  const result = ChildProcessUtilities.execSync(
    "npm",
    ["dist-tag", "ls", pkg.name],
    getExecOpts(pkg, registry)
  );

  return result.indexOf(tag) >= 0;
}

function remove(pkg, tag, { registry }) {
  log.silly("npmDistTag.remove", tag, pkg.name);

  return ChildProcessUtilities.exec("npm", ["dist-tag", "rm", pkg.name, tag], getExecOpts(pkg, registry));
}
