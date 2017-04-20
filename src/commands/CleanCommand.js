import async from "async";
import path from "path";
import _ from "lodash";
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
    group: "Command Options:",
    describe: "Skip all confirmation prompts"
  }
};

export default class CleanCommand extends Command {
  initialize(callback) {
    this.directoriesToDelete = this.filteredPackages.map((pkg) => pkg.nodeModulesLocation);

    if (this.options.yes) {
      callback(null, true);
    } else {
      this.logger.info("", `About to remove the following directories:\n${
        this.directoriesToDelete.map((dir) => path.relative(this.repository.rootPath, dir)).join("\n")
      }`);

      PromptUtilities.confirm("Proceed?", (confirmed) => {
        callback(null, confirmed);
      });
    }
  }

  execute(callback) {
    const tracker = this.logger.newItem("execute");
    tracker.addWork(this.directoriesToDelete.length);

    const chunked = _.chunk(this.directoriesToDelete, this.concurrency);

    async.parallelLimit(chunked.map((directories) => (cb) => {
      FileSystemUtilities.rimraf(directories, (err) => {
        tracker.completeWork(directories.length);

        cb(err);
      });
    }), this.concurrency, (err) => {
      tracker.finish();

      if (err) {
        callback(err);
      } else {
        this.logger.success("clean", "finished");
        callback(null, true);
      }
    });
  }
}
