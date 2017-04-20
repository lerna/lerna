import GitUtilities from "../GitUtilities";
import Command from "../Command";
import ChildProcessUtilities from "../ChildProcessUtilities";
import _ from "lodash";

export function handler(argv) {
  return new DiffCommand([argv.pkg], argv).run();
}

export const command = "diff <pkg>";

export const describe = "Diff all packages or a single package since the last release.";

export const builder = {};

function getLastCommit(execOpts) {
  if (GitUtilities.hasTags(execOpts)) {
    return GitUtilities.getLastTaggedCommit(execOpts);
  }

  return GitUtilities.getFirstCommit(execOpts);
}

export default class DiffCommand extends Command {
  initialize(callback) {
    const packageName = this.input[0];

    let targetPackage;

    if (packageName) {
      targetPackage = _.find(this.packages, (pkg) => {
        return pkg.name === packageName;
      });

      if (!targetPackage) {
        callback(new Error("Package '" + packageName + "' does not exist."));
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
    }

    callback(null, true);
  }

  execute(callback) {
    ChildProcessUtilities.spawn("git", this.args, this.execOpts, (err) => {
      if (err && err.code) {
        callback(err);
      } else {
        callback(null, true);
      }
    });
  }
}
