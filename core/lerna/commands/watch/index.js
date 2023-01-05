// @ts-check

"use strict";

const { Command } = require("@lerna/command");
const { getFilteredPackages } = require("@lerna/filter-options");
const { ValidationError } = require("@lerna/validation-error");
const { watch } = require("nx/src/command-line/watch");
const { readNxJson } = require("nx/src/config/configuration");

module.exports = factory;

const getNxProjectNamesFromLernaPackageNames = (packageNames) => {
  const nxJson = readNxJson();
  const nxConfiguredNpmScope = nxJson.npmScope;

  return nxConfiguredNpmScope
    ? packageNames.map((name) => name.replace(`@${nxConfiguredNpmScope}/`, ""))
    : packageNames;
};

function factory(argv) {
  return new WatchCommand(argv);
}

class WatchCommand extends Command {
  get requiresGit() {
    return false;
  }

  async initialize() {
    if (!this.options.command) {
      throw new ValidationError("ENOCOMMAND", "A command to execute is required");
    }

    this.filteredPackages = await getFilteredPackages(this.packageGraph, this.execOpts, this.options);

    this.count = this.filteredPackages.length;
    this.packagePlural = this.count === 1 ? "package" : "packages";
  }

  async execute() {
    this.logger.info(
      "watch",
      "Executing command %j on changes in %d %s.",
      this.options.command,
      this.count,
      this.packagePlural
    );

    const projectNames = getNxProjectNamesFromLernaPackageNames(this.filteredPackages.map((p) => p.name));

    await watch({
      command: this.options.command,
      projectNameEnvName: "LERNA_PACKAGE_NAME",
      fileChangesEnvName: "LERNA_FILE_CHANGES",
      includeDependentProjects: false, // dependent projects are accounted for via lerna filter options
      projects: projectNames,
      verbose: this.options.verbose,
    });
  }
}

module.exports.WatchCommand = WatchCommand;
