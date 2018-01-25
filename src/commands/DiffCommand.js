"use strict";

const _ = require("lodash");

const ChildProcessUtilities = require("../ChildProcessUtilities");
const Command = require("../Command");
const GitUtilities = require("../GitUtilities");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new DiffCommand(argv);
};

exports.command = "diff [pkgName]";

exports.describe = "Diff all packages or a single package since the last release.";

exports.builder = yargs =>
  yargs.positional("pkgName", {
    describe: "An optional package name to filter the diff output",
  });

function getLastCommit(execOpts) {
  if (GitUtilities.hasTags(execOpts)) {
    return GitUtilities.getLastTaggedCommit(execOpts);
  }

  return GitUtilities.getFirstCommit(execOpts);
}

class DiffCommand extends Command {
  initialize(callback) {
    const packageName = this.options.pkgName;

    // don't interrupt spawned or streaming stdio
    this.logger.disableProgress();

    let targetPackage;

    if (packageName) {
      targetPackage = _.find(this.packages, pkg => pkg.name === packageName);

      if (!targetPackage) {
        callback(new Error(`Package '${packageName}' does not exist.`));
        return;
      }
    }

    if (!GitUtilities.hasCommit(this.execOpts)) {
      callback(new Error("Can't diff. There are no commits in this repository, yet."));
      return;
    }

    this.args = ["diff", getLastCommit(this.execOpts), "--color=auto"];

    if (targetPackage) {
      this.args.push("--", targetPackage.location);
    } else {
      this.args.push("--", ...this.repository.packageParentDirs);
    }

    callback(null, true);
  }

  execute(callback) {
    ChildProcessUtilities.spawn("git", this.args, this.execOpts, err => {
      if (err && err.code) {
        callback(err);
      } else {
        callback(null, true);
      }
    });
  }
}
