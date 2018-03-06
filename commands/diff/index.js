"use strict";

const ChildProcessUtilities = require("@lerna/child-process");
const Command = require("@lerna/command");
const GitUtilities = require("@lerna/git-utils");
const ValidationError = require("@lerna/validation-error");
const getLastCommit = require("./lib/get-last-commit");

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

module.exports = DiffCommand;
