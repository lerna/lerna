"use strict";

const pMap = require("p-map");
const pMapSeries = require("p-map-series");

const ChildProcessUtilities = require("../ChildProcessUtilities");
const Command = require("../Command");
const batchPackages = require("../utils/batch-packages");
const ValidationError = require("../utils/validation-error");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new ExecCommand(argv);
};

exports.command = "exec [cmd] [args..]";

exports.describe = "Run an arbitrary command in each package.";

exports.builder = yargs =>
  yargs
    .example("$0 exec ls -- --la", "# execute `ls -la` in all packages")
    .example("$0 exec -- ls --la", "# execute `ls -la` in all packages, keeping cmd outside")
    .options({
      bail: {
        group: "Command Options:",
        describe: "Bail on exec execution when the command fails within a package",
        type: "boolean",
        default: undefined,
      },
      stream: {
        group: "Command Options:",
        describe: "Stream output with lines prefixed by package.",
        type: "boolean",
        default: undefined,
      },
      parallel: {
        group: "Command Options:",
        describe: "Run command in all packages with unlimited concurrency, streaming prefixed output",
        type: "boolean",
        default: undefined,
      },
    })
    .positional("cmd", {
      describe: "The command to execute. Any command flags must be passed after --",
      type: "string",
    })
    .positional("args", {
      describe: "Positional arguments (not recognized by lerna) to send to command",
      type: "string",
    });

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

    return pMapSeries(this.batchedPackages, batch =>
      pMap(
        batch,
        pkg =>
          this.runCommandInPackage(pkg).catch(err => {
            if (err.code) {
              this.logger.error("exec", `Errored while executing '${err.cmd}' in '${pkg.name}'`);
            }

            throw err;
          }),
        { concurrency: this.concurrency }
      )
    );
  }

  getOpts(pkg) {
    return {
      cwd: pkg.location,
      shell: true,
      env: Object.assign({}, process.env, {
        LERNA_PACKAGE_NAME: pkg.name,
        LERNA_ROOT_PATH: this.repository.rootPath,
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
