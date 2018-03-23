"use strict";

const ChildProcessUtilities = require("@lerna/child-process");
const Command = require("@lerna/command");
const batchPackages = require("@lerna/batch-packages");
const runParallelBatches = require("@lerna/run-parallel-batches");
const ValidationError = require("@lerna/validation-error");

class ExecCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      bail: true,
      parallel: false,
    });
  }

  initialize() {
    const dashedArgs = this.options["--"] || [];
    const { cmd, args } = this.options;

    this.command = cmd || dashedArgs.shift();
    this.args = (args || []).concat(dashedArgs);

    if (!this.command) {
      throw new ValidationError("exec", "A command to execute is required");
    }

    // don't interrupt spawned or streaming stdio
    this.logger.disableProgress();

    const { filteredPackages } = this;

    this.batchedPackages = this.toposort
      ? batchPackages(filteredPackages, this.options.rejectCycles)
      : [filteredPackages];
  }

  execute() {
    if (this.options.parallel) {
      return this.runCommandInPackagesParallel();
    }

    return runParallelBatches(this.batchedPackages, this.concurrency, pkg =>
      this.runCommandInPackage(pkg).catch(err => {
        if (err.code) {
          this.logger.error("exec", `Errored while executing '${err.cmd}' in '${pkg.name}'`);
        }

        throw err;
      })
    );
  }

  getOpts(pkg) {
    return {
      cwd: pkg.location,
      shell: true,
      env: Object.assign({}, process.env, {
        LERNA_PACKAGE_NAME: pkg.name,
        LERNA_ROOT_PATH: this.project.rootPath,
      }),
      reject: this.options.bail,
    };
  }

  runCommandInPackagesParallel() {
    this.logger.info(
      "exec",
      "in %d package(s): %s",
      this.filteredPackages.length,
      [this.command].concat(this.args).join(" ")
    );

    return Promise.all(
      this.filteredPackages.map(pkg =>
        ChildProcessUtilities.spawnStreaming(this.command, this.args, this.getOpts(pkg), pkg.name)
      )
    );
  }

  runCommandInPackage(pkg) {
    if (this.options.stream) {
      return ChildProcessUtilities.spawnStreaming(this.command, this.args, this.getOpts(pkg), pkg.name);
    }

    return ChildProcessUtilities.spawn(this.command, this.args, this.getOpts(pkg));
  }
}

module.exports = ExecCommand;
