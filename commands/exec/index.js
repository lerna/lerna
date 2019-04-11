"use strict";

const os = require("os");

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
      this.packagePlural = this.count === 1 ? "package" : "packages";
      this.joinedCommand = [this.command].concat(this.args).join(" ");

      this.batchedPackages = this.toposort
        ? batchPackages(this.filteredPackages, this.options.rejectCycles)
        : [this.filteredPackages];
    });
  }

  execute() {
    this.logger.info(
      "",
      "Executing command in %d %s: %j",
      this.count,
      this.packagePlural,
      this.joinedCommand
    );

    let chain = Promise.resolve();

    if (this.options.parallel) {
      chain = chain.then(() => this.runCommandInPackagesParallel());
    } else {
      chain = chain.then(() => this.runCommandInPackagesBatched());
    }

    if (this.bail) {
      // only the first error is caught
      chain = chain.catch(err => {
        process.exitCode = err.code;

        // rethrow to halt chain and log properly
        throw err;
      });
    } else {
      // detect error (if any) from collected results
      chain = chain.then(results => {
        /* istanbul ignore else */
        if (results.some(result => result.failed)) {
          // propagate "highest" error code, it's probably the most useful
          const codes = results
            .filter(result => result.failed)
            .map(result => {
              switch (typeof result.code) {
                case "number":
                  return result.code;
                case "string":
                  return os.constants.errno[result.code];
                default:
                  throw new TypeError("Received unexpected exit code value");
              }
            });
          const exitCode = Math.max(...codes, 1);

          this.logger.error("", "Received non-zero exit code %d during execution", exitCode);
          process.exitCode = exitCode;
        }
      });
    }

    return chain.then(() => {
      this.logger.success(
        "exec",
        "Executed command in %d %s: %j",
        this.count,
        this.packagePlural,
        this.joinedCommand
      );
    });
  }

  getOpts(pkg) {
    // these options are passed _directly_ to execa
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

  runCommandInPackagesBatched() {
    const runner = this.options.stream
      ? pkg => this.runCommandInPackageStreaming(pkg)
      : pkg => this.runCommandInPackageCapturing(pkg);

    return runParallelBatches(this.batchedPackages, this.concurrency, runner).then(batchedResults =>
      batchedResults.reduce((arr, batch) => arr.concat(batch), [])
    );
  }

  runCommandInPackagesParallel() {
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
