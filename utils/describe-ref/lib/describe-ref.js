"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = describeRef;
module.exports.parse = parse;
module.exports.sync = sync;

function getArgs(options) {
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

function describeRef(options = {}) {
  const promise = childProcess.exec("git", getArgs(options), options);

  return promise.then(({ stdout }) => {
    const result = parse(stdout, options);

    log.verbose("git-describe", "%j => %j", options && options.match, stdout);
    log.silly("git-describe", "parsed => %j", result);

    return result;
  });
}

function sync(options = {}) {
  const stdout = childProcess.execSync("git", getArgs(options), options);
  const result = parse(stdout, options);

  // only called by collect-updates with no matcher
  log.silly("git-describe.sync", "%j => %j", stdout, result);

  return result;
}

function parse(stdout, options = {}) {
  // when git describe fails to locate tags, it returns only the minimal sha
  if (/^[0-9a-f]{7,40}/.test(stdout)) {
    // repo might still be dirty
    const [, sha, isDirty] = /^([0-9a-f]{7,40})(-dirty)?/.exec(stdout);

    // count number of commits since beginning of time
    const refCount = childProcess.execSync("git", ["rev-list", "--count", sha], options);

    return { refCount, sha, isDirty: Boolean(isDirty) };
  }

  const [, lastTagName, lastVersion, refCount, sha, isDirty] =
    /^((?:.*@)?(.*))-(\d+)-g([0-9a-f]+)(-dirty)?$/.exec(stdout) || [];

  return { lastTagName, lastVersion, refCount, sha, isDirty: Boolean(isDirty) };
}
