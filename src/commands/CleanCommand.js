import async from "async";
import path from "path";

import Command from "../Command";
import FileSystemUtilities from "../FileSystemUtilities";
import PromptUtilities from "../PromptUtilities";

export function handler(argv) {
  new CleanCommand(argv._, argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

export const command = "clean";

export const describe = "Remove the node_modules directory from all packages.";

export const builder = {
  yes: {
    group: "Command Options:",
    describe: "Skip all confirmation prompts",
  },
};

export default class CleanCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize(callback) {
    this.directoriesToDelete = this.filteredPackages.map(pkg => pkg.nodeModulesLocation);

    if (this.options.yes) {
      callback(null, true);
    } else {
      this.logger.info(
        "",
        `About to remove the following directories:\n${this.directoriesToDelete
          .map(dir => path.relative(this.repository.rootPath, dir))
          .join("\n")}`,
      );

      PromptUtilities.confirm("Proceed?", confirmed => {
        callback(null, confirmed);
      });
    }
  }

  execute(callback) {
    const tracker = this.logger.newItem("clean");
    tracker.addWork(this.directoriesToDelete.length);

    async.parallelLimit(
      this.directoriesToDelete.map(dirPath => cb => {
        tracker.info("clean", "removing", dirPath);

        FileSystemUtilities.rimraf(dirPath, err => {
          tracker.completeWork(1);
          cb(err);
        });
      }),
      this.concurrency,
      err => {
        tracker.finish();

        if (err) {
          callback(err);
        } else {
          this.logger.success("clean", "finished");
          callback(null, true);
        }
      },
    );
  }
}
