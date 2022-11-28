// @ts-check

"use strict";

const { Command } = require("@lerna/command");
const { getFilteredPackages } = require("@lerna/filter-options");
const { ValidationError } = require("@lerna/validation-error");
const childProcess = require("@lerna/child-process");
const pMap = require("p-map");
const { daemonClient } = require("nx/src/daemon/client/client");
const { exit } = require("process");

module.exports = factory;

function factory(argv) {
  return new WatchCommand(argv);
}

class WatchCommand extends Command {
  get requiresGit() {
    return false;
  }

  async initialize() {
    const dashedArgs = this.options?.["--"] || [];
    this.command = dashedArgs.shift();
    this.args = dashedArgs;

    if (!this.command) {
      throw new ValidationError("ENOCOMMAND", "A command to execute is required");
    }

    // accessing properties of process.env can be expensive,
    // so cache it here to reduce churn during tighter loops
    this.env = Object.assign({}, process.env);

    this.filteredPackages = await getFilteredPackages(this.packageGraph, this.execOpts, this.options);

    this.count = this.filteredPackages.length;
    this.packagePlural = this.count === 1 ? "package" : "packages";
    this.joinedCommand = [this.command].concat(this.args).join(" ");
  }

  async execute() {
    this.logger.info(
      "watch",
      "Executing command in %d %s: %j",
      this.count,
      this.packagePlural,
      this.joinedCommand
    );

    await pMap(this.filteredPackages, (pkg) => this.runCommandInPackageStreaming(pkg));

    await daemonClient.registerFileWatcher(
      {
        watchGlobalWorkspaceFiles: true,
        watchProjects: this.filteredPackages?.map((p) => p.name) || [],
        // includeDependentProjects?: boolean
      },
      async (error, data) => {
        if (error === "closed") {
          // logger.error('...')
          exit(1);
        }
        // otherwise, keep going, even if there is an error

        // convert between projects <-> package name?
        await pMap(data?.changedProjects || [], (pkg) => this.runCommandInPackageStreaming(pkg));
      }
    );

    this.logger.success("watch", "Commands finished");
  }

  getOpts(pkg) {
    return {
      cwd: pkg.location,
      shell: true,
      extendEnv: false,
      env: Object.assign({}, this.env, {
        LERNA_PACKAGE_NAME: pkg.name,
        LERNA_ROOT_PATH: this.project.rootPath,
      }),
      pkg,
    };
  }

  runCommandInPackageStreaming(pkg) {
    // runOne({ ... })
    return childProcess.spawnStreaming(this.command, this.args, this.getOpts(pkg), pkg.name);
  }
}

module.exports.WatchCommand = WatchCommand;
