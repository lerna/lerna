import { Command, CommandConfigOptions, ValidationError } from "@lerna/core";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getLastCommit } = require("./lib/get-last-commit");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { hasCommit } = require("./lib/has-commit");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new DiffCommand(argv);
};

interface DiffCommandOptions extends CommandConfigOptions {
  pkgName: string;
  ignoreChanges: string[];
}

class DiffCommand extends Command<DiffCommandOptions> {
  private args: string[];

  initialize() {
    const packageName = this.options.pkgName;

    let targetPackage;

    if (packageName) {
      targetPackage = this.packageGraph.get(packageName);

      if (!targetPackage) {
        throw new ValidationError("ENOPKG", `Cannot diff, the package '${packageName}' does not exist.`);
      }
    }

    if (!hasCommit(this.execOpts)) {
      throw new ValidationError("ENOCOMMITS", "Cannot diff, there are no commits in this repository yet.");
    }

    const args = ["diff", getLastCommit(this.execOpts), "--color=auto"];

    if (targetPackage) {
      args.push("--", targetPackage.location);
    } else {
      args.push("--", ...this.project.packageParentDirs);
    }

    if (this.options.ignoreChanges) {
      this.options.ignoreChanges.forEach((ignorePattern) => {
        // https://stackoverflow.com/a/21079437
        args.push(`:(exclude,glob)${ignorePattern}`);
      });
    }

    this.args = args;
  }

  execute() {
    return childProcess.spawn("git", this.args, this.execOpts).catch((err) => {
      if (err.exitCode) {
        // quitting the diff viewer is not an error
        throw err;
      }
    });
  }
}

module.exports.DiffCommand = DiffCommand;
