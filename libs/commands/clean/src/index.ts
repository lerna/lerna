// TODO: refactor based on TS feedback
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Command, getFilteredPackages, promptConfirmation, pulseTillDone, rimrafDir } from "@lerna/core";
import pMap from "p-map";
import path from "path";

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new CleanCommand(argv);
};

class CleanCommand extends Command {
  get requiresGit() {
    return false;
  }

  override initialize() {
    let chain = Promise.resolve();

    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then((filteredPackages) => {
      this.directoriesToDelete = filteredPackages.map((pkg) => pkg.nodeModulesLocation);
    });

    return chain.then(() => {
      if (this.options.yes) {
        return true;
      }

      this.logger.info("", "Removing the following directories:");
      this.logger.info(
        "clean",
        this.directoriesToDelete.map((dir) => path.relative(this.project.rootPath, dir)).join("\n")
      );

      return promptConfirmation("Proceed?");
    });
  }

  override execute() {
    this.enableProgressBar();

    const tracker = this.logger.newItem("clean");
    const mapper = (dirPath) => {
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
