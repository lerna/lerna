"use strict";

const ChildProcessUtilities = require("../ChildProcessUtilities");
const Command = require("../Command");
const GitUtilities = require("../GitUtilities");
const ValidationError = require("../utils/validation-error");

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
  initialize() {
    const packageName = this.options.pkgName;

    // don't interrupt spawned or streaming stdio
    this.logger.disableProgress();

    let targetPackage;

    if (packageName) {
      targetPackage = this.packageGraph.get(packageName);

      if (!targetPackage) {
        throw new ValidationError("ENOPKG", `Cannot diff, the package '${packageName}' does not exist.`);
      }
    }

    if (!GitUtilities.hasCommit(this.execOpts)) {
      throw new ValidationError("ENOCOMMITS", "Cannot diff, there are no commits in this repository yet.");
    }

    const args = ["diff", getLastCommit(this.execOpts), "--color=auto"];

    if (targetPackage) {
      args.push("--", targetPackage.location);
    } else {
      args.push("--", ...this.repository.packageParentDirs);
    }

    this.args = args;
  }

  execute() {
    return ChildProcessUtilities.spawn("git", this.args, this.execOpts).catch(err => {
      if (err.code) {
        // quitting the diff viewer is not an error
        throw err;
      }
    });
  }
}
