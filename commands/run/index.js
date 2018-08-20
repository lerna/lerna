"use strict";

const pMap = require("p-map");

const Command = require("@lerna/command");
const npmRunScript = require("@lerna/npm-run-script");
const batchPackages = require("@lerna/batch-packages");
const runParallelBatches = require("@lerna/run-parallel-batches");
const output = require("@lerna/output");
const ValidationError = require("@lerna/validation-error");
const { getFilteredPackages } = require("@lerna/filter-options");

module.exports = factory;

function factory(argv) {
  return new RunCommand(argv);
}

class RunCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    const { script, npmClient = "npm" } = this.options;

    this.script = script;
    this.args = this.options["--"] || [];
    this.npmClient = npmClient;

    if (!script) {
      throw new ValidationError("ENOSCRIPT", "You must specify a lifecycle script to run");
    }

    // inverted boolean options
    this.bail = this.options.bail !== false;
    this.prefix = this.options.prefix !== false;

    let chain = Promise.resolve();

    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then(filteredPackages => {
      this.packagesWithScript =
        script === "env"
          ? filteredPackages
          : filteredPackages.filter(pkg => pkg.scripts && pkg.scripts[script]);
    });

    return chain.then(() => {
      this.count = this.packagesWithScript.length;

      if (!this.count) {
        this.logger.success("run", `No packages found with the lifecycle script '${script}'`);

        // still exits zero, aka "ok"
        return false;
      }

      this.batchedPackages = this.toposort
        ? batchPackages(this.packagesWithScript, this.options.rejectCycles)
        : [this.packagesWithScript];
    });
  }

  execute() {
    let chain = Promise.resolve();

    if (this.options.parallel) {
      chain = chain.then(() => this.runScriptInPackagesParallel());
    } else {
      chain = chain.then(() => this.runScriptInPackagesBatched());
    }

    return chain.then(() => {
      this.logger.success(
        "run",
        "Ran npm script '%s' in %d %s:",
        this.script,
        this.count,
        this.count === 1 ? "package" : "packages"
      );
      this.logger.success("", this.packagesWithScript.map(pkg => `- ${pkg.name}`).join("\n"));
    });
  }

  getOpts(pkg) {
    return {
      args: this.args,
      npmClient: this.npmClient,
      prefix: this.prefix,
      reject: this.bail,
      pkg,
    };
  }

  runScriptInPackagesBatched() {
    const runner = this.options.stream
      ? pkg => this.runScriptInPackageStreaming(pkg)
      : pkg => this.runScriptInPackageCapturing(pkg);

    return runParallelBatches(this.batchedPackages, this.concurrency, runner);
  }

  runScriptInPackagesParallel() {
    this.logger.info(
      "run",
      "in %d %s: %s run %s",
      this.count,
      this.count === 1 ? "package" : "packages",
      this.npmClient,
      [this.script].concat(this.args).join(" ")
    );

    return pMap(this.packagesWithScript, pkg => this.runScriptInPackageStreaming(pkg));
  }

  runScriptInPackageStreaming(pkg) {
    return npmRunScript.stream(this.script, this.getOpts(pkg));
  }

  runScriptInPackageCapturing(pkg) {
    return npmRunScript(this.script, this.getOpts(pkg)).then(result => {
      output(result.stdout);
    });
  }
}

module.exports.RunCommand = RunCommand;
