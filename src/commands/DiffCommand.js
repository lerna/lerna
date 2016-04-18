import GitUtilities from "../GitUtilities";
import Command from "../Command";
import ChildProcessUtilities from "../ChildProcessUtilities";
import find from "lodash.find";

export default class DiffCommand extends Command {
  initialize(callback) {
    this.packageName = this.input[0];

    if (this.packageName) {
      this.package = find(this.packages, pkg => {
        return pkg.name === this.packageName;
      });

      if (!this.package) {
        this.logger.error("Package '" + this.packageName + "' does not exist.");
        this.exit(1);
      }
    }

    this.filePath = this.package
      ? this.package.location
      : this.repository.packagesLocation;

    this.lastCommit = GitUtilities.hasTags()
      ? GitUtilities.getLastTaggedCommit()
      : GitUtilities.getFirstCommit();

    callback();
  }

  execute() {
    ChildProcessUtilities.spawn("git", ["diff", this.lastCommit, "--color=auto", this.filePath]);
  }
}
