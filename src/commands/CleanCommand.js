import FileSystemUtilities from "../FileSystemUtilities";
import PromptUtilities from "../PromptUtilities";
import Command from "../Command";
import {uniq} from "lodash";
import async from "async";

const SUPPORTED_OPTS = ["yes"];

export default class CleanCommand extends Command {
  static getSupportedOptions() {
    return uniq(Command.getSupportedOptions().concat(SUPPORTED_OPTS));
  }

  initialize(callback) {
    const {yes} = this.getAvailableOptions();
    if (yes) {
      callback(null, true);
    } else {
      this.logger.info(`About to remove the following directories:\n${
        this.filteredPackages.map((pkg) => "- " + pkg.nodeModulesLocation).join("\n")
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
    this.progressBar.init(this.filteredPackages.length);
    this.rimrafNodeModulesInPackages((err) => {
      this.progressBar.terminate();
      if (err) {
        callback(err);
      } else {
        this.logger.info("All clean!");
        callback(null, true);
      }
    });
  }

  rimrafNodeModulesInPackages(callback) {
    async.parallelLimit(this.filteredPackages.map((pkg) => (cb) => {
      FileSystemUtilities.rimraf(pkg.nodeModulesLocation, (err) => {
        this.progressBar.tick(pkg.name);
        cb(err);
      });
    }), this.concurrency, callback);
  }
}
