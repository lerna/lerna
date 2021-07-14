"use strict";

const path = require("path");
const util = require("util");
const writeFile = util.promisify(require("fs").writeFile);

const { Command } = require("@lerna/command");
const { runTopologically } = require("@lerna/run-topologically");
const { output } = require("@lerna/output");

const { packDirectory } = require("./pack-directory");
const { getPacked } = require("./get-packed");
const { logPacked } = require("./log-packed");

module.exports = factory;

/** @param {import("../command").PackArgv} argv */
function factory(argv) {
  return new PackCommand(argv);
}

class PackCommand extends Command {
  get requiresGit() {
    return false;
  }

  async initialize() {
    this.logger.info("pack", "TODO");

    // determine spec type (package name or directory)

    // create list of target packages
    this.packagesToPack = [];
  }

  async execute() {
    this.logger.info("pack", "TODO");

    const writeEnabled = this.options.dryRun !== true;

    // topologically pack directories
    const packed = await runTopologically(
      this.packagesToPack,
      async (pkg) => {
        const tarballData = await packDirectory(pkg, pkg.location, {
          log: this.logger,
          ignorePrepublish: true,
        });
        const pkgContents = await getPacked(pkg, tarballData);

        if (writeEnabled) {
          await writeFile(path.join(pkg.location, pkgContents.filename), tarballData);
        }

        return pkgContents;
      },
      {
        concurrency: this.concurrency,
        graphType: "allDependencies",
        rejectCycles: this.options.rejectCycles,
      }
    );

    // log package contents
    for (const info of packed) {
      logPacked(info, {
        log: this.logger,
        unicode: this.options.unicode,
      });
      output(info.filename);
    }
  }
}
