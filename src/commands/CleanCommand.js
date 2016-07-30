import async from "async";
import Command from "../Command";
import FileSystemUtilities from "../FileSystemUtilities";
import PromptUtilities from "../PromptUtilities";
import progressBar from "../progressBar";

export default class CleanCommand extends Command {
  initialize(callback) {
    if (this.flags.yes) {
      callback(null, true);
    } else {
      this.logger.info(`About remove the following directories:\n${
        this.packages.map((pkg) => "- " + pkg.nodeModulesLocation).join("\n")
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
    progressBar.init(this.packages.length);
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
    async.parallelLimit(this.packages.map((pkg) => (cb) => {
      FileSystemUtilities.rimraf(pkg.nodeModulesLocation, (err) => {
        progressBar.tick(pkg.name);
        cb(err);
      });
    }), this.concurrency, callback);
  }
}
