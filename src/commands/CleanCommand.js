"use strict";

const async = require("async");
const path = require("path");

const Command = require("../Command");
const FileSystemUtilities = require("../FileSystemUtilities");
const PromptUtilities = require("../PromptUtilities");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new CleanCommand(argv);
};

exports.command = "clean";

exports.describe = "Remove the node_modules directory from all packages.";

exports.builder = {
  yes: {
    group: "Command Options:",
    describe: "Skip all confirmation prompts",
  },
};

class CleanCommand extends Command {
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
          .join("\n")}`
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
      }
    );
  }
}
