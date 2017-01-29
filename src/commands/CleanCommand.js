import async from "async";
import Command from "../Command";
import FileSystemUtilities from "../FileSystemUtilities";
import PackageUtilities from "../PackageUtilities";
import PromptUtilities from "../PromptUtilities";
import progressBar from "../progressBar";

export default class CleanCommand extends Command {
  initialize(callback) {
    this.packagesToClean = this.filteredPackages;
    if (this.flags.includeFilteredDependencies) {
      this.packagesToClean = PackageUtilities.addDependencies(this.packagesToClean, this.packageGraph);
    }

    if (this.flags.yes) {
      callback(null, true);
    } else {
      this.logger.info(`About to remove the following directories:\n${
        this.packagesToClean.map((pkg) => "- " + pkg.nodeModulesLocation).join("\n")
      }`);
      PromptUtilities.confirm("Proceed?", (confirmed) => {
        if (confirmed) {
          callback(null, true);
        } else {
          this.logger.info("Okay bye!");
          callback(null, false);
        }
      });
    }
  }

  execute(callback) {
    progressBar.init(this.packagesToClean.length);
    this.rimrafNodeModulesInPackages((err) => {
      progressBar.terminate();
      if (err) {
        callback(err);
      } else {
        this.logger.info("All clean!");
        callback(null, true);
      }
    });
  }

  rimrafNodeModulesInPackages(callback) {
    async.parallelLimit(this.packagesToClean.map((pkg) => (cb) => {
      FileSystemUtilities.rimraf(pkg.nodeModulesLocation, (err) => {
        progressBar.tick(pkg.name);
        cb(err);
      });
    }), this.concurrency, callback);
  }
}
