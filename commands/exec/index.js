"use strict";

const ChildProcessUtilities = require("@lerna/child-process");
const Command = require("@lerna/command");
const batchPackages = require("@lerna/batch-packages");
const runParallelBatches = require("@lerna/run-parallel-batches");
const ValidationError = require("@lerna/validation-error");
const { getFilteredPackages } = require("@lerna/filter-options");

module.exports = factory;

function factory(argv) {
  return new ExecCommand(argv);
}

class ExecCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    const dashedArgs = this.options["--"] || [];

    this.command = this.options.cmd || dashedArgs.shift();
    this.args = (this.options.args || []).concat(dashedArgs);

    if (!this.command) {
      throw new ValidationError("ENOCOMMAND", "A command to execute is required");
    }

    // inverted boolean options
    this.bail = this.options.bail !== false;
    this.prefix = this.options.prefix !== false;

    // accessing properties of process.env can be expensive,
    // so cache it here to reduce churn during tighter loops
    this.env = Object.assign({}, process.env);

    let chain = Promise.resolve();

    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then(filteredPackages => {
      this.filteredPackages = filteredPackages;
    });

    return chain.then(() => {
      this.count = this.filteredPackages.length;
      this.batchedPackages = this.toposort
        ? batchPackages(this.filteredPackages, this.options.rejectCycles)
        : [this.filteredPackages];
    });
  }

  execute() {
    if (this.options.parallel) {
      return this.runCommandInPackagesParallel();
    }

    const runner = this.options.stream
      ? pkg => this.runCommandInPackageStreaming(pkg)
      : pkg => this.runCommandInPackageCapturing(pkg);

    return runParallelBatches(this.batchedPackages, this.concurrency, runner).then(() => {
      this.logger.success(
        "exec",
        "Executed command in %d %s: %j",
        this.count,
        this.count === 1 ? "package" : "packages",
        [this.command].concat(this.args).join(" ")
      );
    });
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
      reject: this.bail,
      pkg,
    };
  }

  runCommandInPackagesParallel() {
    this.logger.info(
      "exec",
      "in %d %s: %j",
      this.count,
      this.count === 1 ? "package" : "packages",
      [this.command].concat(this.args).join(" ")
    );

    return Promise.all(this.filteredPackages.map(pkg => this.runCommandInPackageStreaming(pkg)));
  }

  runCommandInPackageStreaming(pkg) {
    return ChildProcessUtilities.spawnStreaming(
      this.command,
      this.args,
      this.getOpts(pkg),
      this.prefix && pkg.name
    );
  }

  runCommandInPackageCapturing(pkg) {
    return ChildProcessUtilities.spawn(this.command, this.args, this.getOpts(pkg));
  }
}

module.exports.ExecCommand = ExecCommand;
