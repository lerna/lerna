"use strict";

const path = require("path");
const pMap = require("p-map");

const Command = require("@lerna/command");
const rimrafDir = require("@lerna/rimraf-dir");
const PromptUtilities = require("@lerna/prompt");
const { getFilteredPackages } = require("@lerna/filter-options");
const pulseTillDone = require("@lerna/pulse-till-done");

module.exports = factory;

function factory(argv) {
  return new CleanCommand(argv);
}

class CleanCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    let chain = Promise.resolve();

    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then(filteredPackages => {
      this.directoriesToDelete = filteredPackages.map(pkg => pkg.nodeModulesLocation);
    });

    return chain.then(() => {
      if (this.options.yes) {
        return true;
      }

      this.logger.info("", "Removing the following directories:");
      this.logger.info(
        "clean",
        this.directoriesToDelete.map(dir => path.relative(this.project.rootPath, dir)).join("\n")
      );

      return PromptUtilities.confirm("Proceed?");
    });
  }

  execute() {
    this.enableProgressBar();

    const tracker = this.logger.newItem("clean");
    const mapper = dirPath => {
      tracker.info("clean", "removing", dirPath);

      return pulseTillDone(rimrafDir(dirPath)).then(() => {
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
