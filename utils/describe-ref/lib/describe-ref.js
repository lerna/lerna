"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports.describeRef = describeRef;
module.exports.describeRefSync = describeRefSync;

/**
 * @typedef {object} DescribeRefOptions
 * @property {string} [cwd] Defaults to `process.cwd()`
 * @property {string} [match] Glob passed to `--match` flag
 */

/**
 * @typedef {object} DescribeRefFallbackResult When annotated release tags are missing
 * @property {boolean} isDirty
 * @property {string} refCount
 * @property {string} sha
 */

/**
 * @typedef {object} DescribeRefDetailedResult When annotated release tags are present
 * @property {string} lastTagName
 * @property {string} lastVersion
 * @property {boolean} isDirty
 * @property {string} refCount
 * @property {string} sha
 */

/**
 * Build `git describe` args.
 * @param {DescribeRefOptions} options
 * @param {boolean} [includeMergedTags]
 */
function getArgs(options, includeMergedTags) {
  let args = [
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

  if (includeMergedTags) {
    // we want to consider all tags, also from merged branches
    args = args.filter((arg) => arg !== "--first-parent");
  }

  return args;
}

/**
 * @param {DescribeRefOptions} [options]
 * @param {boolean} [includeMergedTags]
 * @returns {Promise<DescribeRefFallbackResult|DescribeRefDetailedResult>}
 */
function describeRef(options = {}, includeMergedTags) {
  const promise = childProcess.exec("git", getArgs(options, includeMergedTags), options);

  return promise.then(({ stdout }) => {
    const result = parse(stdout, options.cwd);

    log.verbose("git-describe", "%j => %j", options && options.match, stdout);
    log.silly("git-describe", "parsed => %j", result);

    return result;
  });
}

/**
 * @param {DescribeRefOptions} [options]
 * @param {boolean} [includeMergedTags]
 */
function describeRefSync(options = {}, includeMergedTags) {
  const stdout = childProcess.execSync("git", getArgs(options, includeMergedTags), options);
  const result = parse(stdout, options.cwd);

  // only called by collect-updates with no matcher
  log.silly("git-describe.sync", "%j => %j", stdout, result);

  return result;
}

/**
 * Parse git output and return relevant metadata.
 * @param {string} stdout Result of `git describe`
 * @param {string} [cwd] Defaults to `process.cwd()`
 * @returns {DescribeRefFallbackResult|DescribeRefDetailedResult}
 */
function parse(stdout, cwd) {
  const minimalShaRegex = /^([0-9a-f]{7,40})(-dirty)?$/;
  // when git describe fails to locate tags, it returns only the minimal sha
  if (minimalShaRegex.test(stdout)) {
    // repo might still be dirty
    const [, sha, isDirty] = minimalShaRegex.exec(stdout);

    // count number of commits since beginning of time
    const refCount = childProcess.execSync("git", ["rev-list", "--count", sha], { cwd });

    return { refCount, sha, isDirty: Boolean(isDirty) };
  }

  const [, lastTagName, lastVersion, refCount, sha, isDirty] =
    /^((?:.*@)?(.*))-(\d+)-g([0-9a-f]+)(-dirty)?$/.exec(stdout) || [];

  return { lastTagName, lastVersion, refCount, sha, isDirty: Boolean(isDirty) };
}
