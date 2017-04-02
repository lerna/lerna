import GitUtilities from "../GitUtilities";
import Command from "../Command";
import ChildProcessUtilities from "../ChildProcessUtilities";
import find from "lodash/find";

function getLastCommit() {
  if (GitUtilities.hasTags()) {
    return GitUtilities.getLastTaggedCommit();
  }

  return GitUtilities.getFirstCommit();
}

export default class DiffCommand extends Command {
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

    if (!GitUtilities.hasCommit()) {
      callback(new Error("Can't diff. There are no commits in this repository, yet."));
      return;
    }

    this.args = ["diff", getLastCommit(), "--color=auto"];

    if (targetPackage) {
      this.args.push("--", targetPackage.location);
    }

    callback(null, true);
  }

  execute(callback) {
    ChildProcessUtilities.spawn("git", this.args, {}, (code) => {
      if (code) {
        callback(new Error("Errored while spawning `git diff`."));
      } else {
        callback(null, true);
      }
    });
  }
}
