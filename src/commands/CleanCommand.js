import async from "async";
import Command from "../Command";
import FileSystemUtilities from "../FileSystemUtilities";
import PromptUtilities from "../PromptUtilities";

export function handler(argv) {
  return new CleanCommand(argv._, argv).run();
}

export const command = "clean";

export const describe = "Remove the node_modules directory from all packages.";

export const builder = {
  "yes": {
    describe: "Skip all confirmation prompts"
  }
};

export default class CleanCommand extends Command {
  initialize(callback) {
    if (this.flags.yes) {
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
