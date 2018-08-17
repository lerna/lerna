"use strict";

const childProcess = require("@lerna/child-process");

module.exports = describeRef;
module.exports.parse = parse;
module.exports.sync = sync;

function getArgs(options = {}) {
  const args = [
    "describe",
    // fallback to short sha if no tags located
    "--always",
    // always return full result, helps identify existing release
    "--long",
    // annotate if uncommitted changes present
    "--dirty",
    // prefer tags originating on upstream branch
    "--first-parent",
  ];

  if (options.match) {
    args.push("--match", options.match);
  }

  return args;
}

function describeRef(options) {
  const promise = childProcess.exec("git", getArgs(options), options);

  return promise.then(({ stdout }) => parse(stdout));
}

function sync(options) {
  const stdout = childProcess.execSync("git", getArgs(options), options);

  return parse(stdout);
}

function parse(stdout) {
  if (/^[0-9a-f]{7,40}$/.test(stdout)) {
    // fallback received, can't provide full metadata
    return { sha: stdout };
  }

  const [, lastTag, lastVersion, refCount, sha, isDirty] =
    /^((?:.*@)?(.*))-(\d+)-g([0-9a-f]+)(-dirty)?$/.exec(stdout) || [];

  return { lastTag, lastVersion, refCount, sha, isDirty };
}
