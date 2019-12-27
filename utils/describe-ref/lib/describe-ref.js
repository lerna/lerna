"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = describeRef;
module.exports.parse = parseDescribe;
module.exports.sync = sync;

function describeArgs(options, includeMergedTags) {
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
    args = args.filter(arg => arg !== "--first-parent");
  }

  return args;
}

function tagArgs(options, includeMergedTags) {
  const args = ["tag", "--list"];

  if (!includeMergedTags) {
    // we want to ony consider tags reachable from current head commit
    args.push("--merged", "HEAD");
  }

  if (options.match) {
    args.push(options.match);
  }

  return args;
}

async function describeRef(options = {}, includeMergedTags) {
  return describeGuts(options, includeMergedTags);
}

function sync(options = {}, includeMergedTags) {
  return describeGuts(options, includeMergedTags);
}

function describeGuts(options, includeMergedTags) {
  if (options.match) {
    // use tag + rev strategy to find match for any tag, not just latest
    const tags = childProcess.execSync("git", tagArgs(options, includeMergedTags), options).split("\n");

    const tag = tags[tags.length - 1];
    const result = parseRev(options, tag);

    log.verbose("git-describe-ref", "%j => %j", options && options.match, tag);
    log.silly("git-describe-ref", "parsed => %j", result);

    return result;
  }
  // no match args, describe latest tag
  const stdout = childProcess.execSync("git", describeArgs(options, includeMergedTags), options);
  const result = parseDescribe(stdout, options);

  log.verbose("git-describe", "%j => %j", options && options.match, stdout);
  log.silly("git-describe", "parsed => %j", result);

  return result;
}

function parseDescribe(stdout, options = {}) {
  const minimalShaRegex = /^([0-9a-f]{7,40})(-dirty)?$/;
  // when git describe fails to locate tags, it returns only the minimal sha
  if (minimalShaRegex.test(stdout)) {
    // repo might still be dirty
    const [, sha, isDirty] = minimalShaRegex.exec(stdout);

    // count number of commits since beginning of time
    const refCount = childProcess.execSync("git", ["rev-list", "--count", sha], options);

    return { refCount, sha, isDirty: Boolean(isDirty) };
  }

  const [, lastTagName, lastVersion, refCount, sha, isDirty] =
    /^((?:.*@)?(.*))-(\d+)-g([0-9a-f]+)(-dirty)?$/.exec(stdout) || [];

  return { lastTagName, lastVersion, refCount, sha, isDirty: Boolean(isDirty) };
}

function parseRev(options, tag) {
  let foundTag;
  if (!tag) {
    // no tag found, count commits since beginning of branch
    foundTag = "origin";
  } else {
    foundTag = tag;
  }

  const sha = childProcess.execSync("git", ["rev-parse", foundTag], options);

  const tagArr = tag.split("@");

  // commits since found tag
  const refCount = childProcess.execSync(
    "git",
    ["rev-list", foundTag === "origin" ? foundTag : `${foundTag}..`, "--count"],
    options
  );

  // dirty
  const isDirty = !!childProcess.execSync("git", ["diff", "HEAD"], options);

  return {
    lastTagName: tag,
    lastVersion: tagArr[tagArr.length - 1],
    refCount,
    sha,
    isDirty,
  };
}
