import LinkUtilities from "../LinkUtilities";
import Command from "../Command";

export default class LinkCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    LinkUtilities.symlinkPackages(this.filteredPackages, this.packageGraph, this.progressBar, this.logger, (err) => {
      if (err) {
        callback(err);
      } else {
        this.logger.success(`Successfully linked ${this.filteredPackages.length} packages.`);
        callback(null, true);
      }
    });
  }
}
