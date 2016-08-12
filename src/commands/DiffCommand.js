import GitUtilities from "../GitUtilities";
import Command from "../Command";
import ChildProcessUtilities from "../ChildProcessUtilities";
import find from "lodash.find";

export default class DiffCommand extends Command {
  initialize(callback) {
    this.packageName = this.input[0];

    if (this.packageName) {
      this.package = find(this.packages, (pkg) => {
        return pkg.name === this.packageName;
      });

      if (!this.package) {
        callback(new Error("Package '" + this.packageName + "' does not exist."));
        return;
      }
    }

    if (!GitUtilities.hasCommit()) {
      callback(new Error("Can't diff. There are no commits in this repository, yet."));
      return;
    }

    this.filePath = this.package
      ? this.package.location
      : this.repository.packagesLocation;

    this.lastCommit = GitUtilities.hasTags()
      ? GitUtilities.getLastTaggedCommit()
      : GitUtilities.getFirstCommit();

    callback(null, true);
  }

  execute(callback) {
    ChildProcessUtilities.spawn("git", ["diff", this.lastCommit, "--color=auto", this.filePath], {}, (code) => {
      if (code !== 0) {
        callback(new Error("Errored while spawning `git diff`."));
      } else {
        callback(null, true);
      }
    });
  }
}
