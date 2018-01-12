import _ from "lodash";

import ChildProcessUtilities from "../ChildProcessUtilities";
import Command from "../Command";
import GitUtilities from "../GitUtilities";

export function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  const cmd = new DiffCommand([argv.pkg], argv, argv._cwd);
  return cmd.run().then(argv._onResolved, argv._onRejected);
}

export const command = "diff [pkg]";

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
