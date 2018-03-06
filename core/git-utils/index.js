"use strict";

const { EOL } = require("os");
const log = require("npmlog");
const path = require("path");
const slash = require("slash");
const tempWrite = require("temp-write");

const ChildProcessUtilities = require("@lerna/child-process");

function isDetachedHead(opts) {
  log.silly("isDetachedHead");

  const branchName = exports.getCurrentBranch(opts);
  const isDetached = branchName === "HEAD";
  log.verbose("isDetachedHead", isDetached);

  return isDetached;
}

function isInitialized(opts) {
  log.silly("isInitialized");
  let initialized;

  try {
    // we only want the return code, so ignore stdout/stderr
    ChildProcessUtilities.execSync(
      "git",
      ["rev-parse"],
      Object.assign({}, opts, {
        stdio: "ignore",
      })
    );
    initialized = true;
  } catch (err) {
    log.verbose("isInitialized", "swallowed error", err);
    initialized = false;
  }

  // this does not need to be verbose
  log.silly("isInitialized", initialized);
  return initialized;
}

function addFiles(files, opts) {
  log.silly("addFiles", files);
  const filePaths = files.map(file => slash(path.relative(opts.cwd, path.resolve(opts.cwd, file))));
  return ChildProcessUtilities.exec("git", ["add", "--", ...filePaths], opts);
}

function commit(message, opts) {
  log.silly("commit", message);
  const args = ["commit", "--no-verify"];

  if (message.indexOf(EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    args.push("-F", tempWrite.sync(message, "lerna-commit.txt"));
  } else {
    args.push("-m", message);
  }

  log.verbose("commit", args);
  return ChildProcessUtilities.exec("git", args, opts);
}

function addTag(tag, opts) {
  log.silly("addTag", tag);
  return ChildProcessUtilities.exec("git", ["tag", tag, "-m", tag], opts);
}

function hasTags(opts) {
  log.silly("hasTags");

  const yes = !!ChildProcessUtilities.execSync("git", ["tag"], opts);
  log.verbose("hasTags", yes);

  return yes;
}

function getLastTaggedCommit(opts) {
  log.silly("getLastTaggedCommit");

  const taggedCommit = ChildProcessUtilities.execSync("git", ["rev-list", "--tags", "--max-count=1"], opts);
  log.verbose("getLastTaggedCommit", taggedCommit);

  return taggedCommit;
}

function getLastTaggedCommitInBranch(opts) {
  log.silly("getLastTaggedCommitInBranch");

  const tagName = exports.getLastTag(opts);
  const commitInBranch = ChildProcessUtilities.execSync("git", ["rev-list", "-n", "1", tagName], opts);
  log.verbose("getLastTaggedCommitInBranch", commitInBranch);

  return commitInBranch;
}

function getFirstCommit(opts) {
  log.silly("getFirstCommit");

  const firstCommit = ChildProcessUtilities.execSync("git", ["rev-list", "--max-parents=0", "HEAD"], opts);
  log.verbose("getFirstCommit", firstCommit);

  return firstCommit;
}

function pushWithTags(remote, tags, opts) {
  log.silly("pushWithTags", [remote, tags]);

  return Promise.resolve(exports.getCurrentBranch(opts)).then(branch =>
    ChildProcessUtilities.exec("git", ["push", remote, branch], opts).then(() =>
      ChildProcessUtilities.exec("git", ["push", remote].concat(tags), opts)
    )
  );
}

function getLastTag(opts) {
  log.silly("getLastTag");

  const lastTag = ChildProcessUtilities.execSync("git", ["describe", "--tags", "--abbrev=0"], opts);
  log.verbose("getLastTag", lastTag);

  return lastTag;
}

function describeTag(ref, opts) {
  log.silly("describeTag", ref);

  const description = ChildProcessUtilities.execSync("git", ["describe", "--tags", ref], opts);
  log.silly("describeTag", description);

  return description;
}

function diffSinceIn(committish, location, opts) {
  const formattedLocation = slash(path.relative(opts.cwd, location));

  log.silly("diffSinceIn", committish, formattedLocation);

  const diff = ChildProcessUtilities.execSync(
    "git",
    ["diff", "--name-only", committish, "--", formattedLocation],
    opts
  );
  log.silly("diff", diff);

  return diff;
}

function getWorkspaceRoot(opts) {
  log.silly("getWorkspaceRoot");

  const workRoot = ChildProcessUtilities.execSync("git", ["rev-parse", "--show-toplevel"], opts);
  log.verbose("getWorkspaceRoot", workRoot);

  return workRoot;
}

function getCurrentBranch(opts) {
  log.silly("getCurrentBranch");

  const currentBranch = ChildProcessUtilities.execSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], opts);
  log.verbose("getCurrentBranch", currentBranch);

  return currentBranch;
}

function getCurrentSHA(opts) {
  log.silly("getCurrentSHA");

  const sha = ChildProcessUtilities.execSync("git", ["rev-parse", "HEAD"], opts);
  log.verbose("getCurrentSHA", sha);

  return sha;
}

function getShortSHA(opts) {
  log.silly("getShortSHA");

  const sha = ChildProcessUtilities.execSync("git", ["rev-parse", "--short", "HEAD"], opts);
  log.verbose("getShortSHA", sha);

  return sha;
}

function checkoutChanges(fileGlob, opts) {
  log.silly("checkoutChanges", fileGlob);
  return ChildProcessUtilities.exec("git", ["checkout", "--", fileGlob], opts);
}

function init(opts) {
  log.silly("git init");
  ChildProcessUtilities.execSync("git", ["init"], opts);
}

function hasCommit(opts) {
  log.silly("hasCommit");
  let retVal;

  try {
    ChildProcessUtilities.execSync("git", ["log"], opts);
    retVal = true;
  } catch (e) {
    retVal = false;
  }

  log.verbose("hasCommit", retVal);
  return retVal;
}

exports.isDetachedHead = isDetachedHead;
exports.isInitialized = isInitialized;
exports.addFiles = addFiles;
exports.commit = commit;
exports.addTag = addTag;
exports.hasTags = hasTags;
exports.getLastTaggedCommit = getLastTaggedCommit;
exports.getLastTaggedCommitInBranch = getLastTaggedCommitInBranch;
exports.getFirstCommit = getFirstCommit;
exports.pushWithTags = pushWithTags;
exports.getLastTag = getLastTag;
exports.describeTag = describeTag;
exports.diffSinceIn = diffSinceIn;
exports.getWorkspaceRoot = getWorkspaceRoot;
exports.getCurrentBranch = getCurrentBranch;
exports.getCurrentSHA = getCurrentSHA;
exports.getShortSHA = getShortSHA;
exports.checkoutChanges = checkoutChanges;
exports.init = init;
exports.hasCommit = hasCommit;
