import { EOL } from "os";
import log from "npmlog";
import path from "path";
import tempWrite from "temp-write";
import slash from "slash";

import ChildProcessUtilities from "./ChildProcessUtilities";

export default class GitUtilities {
  static isDetachedHead(opts) {
    log.silly("isDetachedHead");

    const branchName = GitUtilities.getCurrentBranch(opts);
    const isDetached = branchName === "HEAD";
    log.verbose("isDetachedHead", isDetached);

    return isDetached;
  }

  static isInitialized(opts) {
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

  static addFile(file, opts) {
    log.silly("addFile", file);
    const relativePath = path.relative(opts.cwd, path.resolve(opts.cwd, file));
    const portablePath = slash(relativePath);
    ChildProcessUtilities.execSync("git", ["add", portablePath], opts);
  }

  static commit(message, opts) {
    log.silly("commit", message);
    const args = ["commit", "--no-verify"];

    if (message.indexOf(EOL) > -1) {
      // Use tempfile to allow multi\nline strings.
      args.push("-F", tempWrite.sync(message, "lerna-commit.txt"));
    } else {
      args.push("-m", message);
    }

    log.verbose("commit", args);
    ChildProcessUtilities.execSync("git", args, opts);
  }

  static addTag(tag, opts) {
    log.silly("addTag", tag);
    ChildProcessUtilities.execSync("git", ["tag", tag, "-m", tag], opts);
  }

  static removeTag(tag, opts) {
    log.silly("removeTag", tag);
    ChildProcessUtilities.execSync("git", ["tag", "-d", tag], opts);
  }

  static hasTags(opts) {
    log.silly("hasTags");

    const yes = !!ChildProcessUtilities.execSync("git", ["tag"], opts);
    log.verbose("hasTags", yes);

    return yes;
  }

  static getLastTaggedCommit(opts) {
    log.silly("getLastTaggedCommit");

    const taggedCommit = ChildProcessUtilities.execSync("git", ["rev-list", "--tags", "--max-count=1"], opts);
    log.verbose("getLastTaggedCommit", taggedCommit);

    return taggedCommit;
  }

  static getLastTaggedCommitInBranch(opts) {
    log.silly("getLastTaggedCommitInBranch");

    const tagName = GitUtilities.getLastTag(opts);
    const commitInBranch = ChildProcessUtilities.execSync("git", ["rev-list", "-n", "1", tagName], opts);
    log.verbose("getLastTaggedCommitInBranch", commitInBranch);

    return commitInBranch;
  }

  static getFirstCommit(opts) {
    log.silly("getFirstCommit");

    const firstCommit = ChildProcessUtilities.execSync("git", ["rev-list", "--max-parents=0", "HEAD"], opts);
    log.verbose("getFirstCommit", firstCommit);

    return firstCommit;
  }

  static pushWithTags(remote, tags, opts) {
    log.silly("pushWithTags", [remote, tags]);

    const branch = GitUtilities.getCurrentBranch(opts);
    ChildProcessUtilities.execSync("git", ["push", "--no-verify", remote, branch].concat(tags), opts);
  }

  static getLastTag(opts) {
    log.silly("getLastTag");

    const lastTag = ChildProcessUtilities.execSync("git", ["describe", "--tags", "--abbrev=0"], opts);
    log.verbose("getLastTag", lastTag);

    return lastTag;
  }

  static describeTag(commit, opts) {
    log.silly("describeTag", commit);

    const description = ChildProcessUtilities.execSync("git", ["describe", "--tags", commit], opts);
    log.silly("describeTag", description);

    return description;
  }

  static diffSinceIn(since, location, opts) {
    const formattedLocation = path.relative(opts.cwd, location).replace(/\\/g, "/");
    log.silly("diffSinceIn", since, formattedLocation);

    const diff = ChildProcessUtilities.execSync(
      "git",
      ["diff", "--name-only", since, "--", formattedLocation],
      opts
    );
    log.silly("diff", diff);

    return diff;
  }

  static getWorkspaceRoot(opts) {
    log.silly("getWorkspaceRoot");
    const root = ChildProcessUtilities.execSync("git", ["rev-parse", "--show-toplevel"], opts);
    log.verbose("getWorkspaceRoot", root);

    return root;
  }

  static getCurrentBranch(opts) {
    log.silly("getCurrentBranch");

    const currentBranch = ChildProcessUtilities.execSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], opts);
    log.verbose("getCurrentBranch", currentBranch);

    return currentBranch;
  }

  static getCurrentSHA(opts) {
    log.silly("getCurrentSHA");

    const sha = ChildProcessUtilities.execSync("git", ["rev-parse", "HEAD"], opts);
    log.verbose("getCurrentSHA", sha);

    return sha;
  }

  static checkoutChanges(fileGlob, opts) {
    log.silly("checkoutChanges", fileGlob);
    ChildProcessUtilities.execSync("git", ["checkout", "--", fileGlob], opts);
  }

  static init(opts) {
    log.silly("git init");
    ChildProcessUtilities.execSync("git", ["init"], opts);
  }

  static hasCommit(opts) {
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
}
