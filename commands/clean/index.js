"use strict";

const path = require("path");
const pMap = require("p-map");

const Command = require("@lerna/command");
const rimrafDir = require("@lerna/rimraf-dir");
const PromptUtilities = require("@lerna/prompt");

module.exports = factory;

function factory(argv) {
  return new CleanCommand(argv);
}

class CleanCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    this.directoriesToDelete = this.filteredPackages.map(pkg => pkg.nodeModulesLocation);

    if (this.options.yes) {
      return true;
    }

    this.logger.info("", "Removing the following directories:");
    this.logger.info(
      "clean",
      this.directoriesToDelete.map(dir => path.relative(this.project.rootPath, dir)).join("\n")
    );

    return PromptUtilities.confirm("Proceed?");
  }

  execute() {
    this.enableProgressBar();

    const tracker = this.logger.newItem("clean");
    const mapper = dirPath => {
      tracker.info("clean", "removing", dirPath);

      return rimrafDir(dirPath).then(() => {
        tracker.completeWork(1);
      });
    };

    tracker.addWork(this.directoriesToDelete.length);

    return pMap(this.directoriesToDelete, mapper, { concurrency: this.concurrency }).then(() => {
      tracker.finish();
      this.logger.success("clean", "finished");
    });
  }
}

module.exports.CleanCommand = CleanCommand;
