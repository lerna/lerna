import GitUtilities from "../GitUtilities";
import Command from "../Command";
import ChildProcessUtilities from "../ChildProcessUtilities";
import find from "lodash/find";

function getLastCommit(execOpts) {
  if (GitUtilities.hasTags(execOpts)) {
    return GitUtilities.getLastTaggedCommit(execOpts);
  }

  return GitUtilities.getFirstCommit(execOpts);
}

export default class DiffCommand extends Command {
  static getSupportedOptions() {
    return Object.assign({}, Command.getSupportedOptions());
  }

  static get describe() {
    return "Diff all packages or a single package since the last release.";
  }

  initialize(callback) {
    const packageName = this.input[0];

    let targetPackage;

    if (packageName) {
      targetPackage = find(this.packages, (pkg) => {
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
    ChildProcessUtilities.spawn("git", this.args, this.execOpts, (code) => {
      if (code) {
        callback(new Error("Errored while spawning `git diff`."));
      } else {
        callback(null, true);
      }
    });
  }
}
