"use strict";

const async = require("async");

const Command = require("../Command");
const npmRunScript = require("../utils/npm-run-script");
const batchPackages = require("../utils/batch-packages");
const runParallelBatches = require("../utils/run-parallel-batches");
const output = require("../utils/output");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new RunCommand(argv);
};

exports.command = "run <script>";

exports.describe = "Run an npm script in each package that contains that script.";

exports.builder = yargs =>
  yargs
    .example("$0 run build -- --silent", "# `npm run build --silent` in all packages with a build script")
    .options({
      stream: {
        group: "Command Options:",
        describe: "Stream output with lines prefixed by package.",
        type: "boolean",
        default: undefined,
      },
      parallel: {
        group: "Command Options:",
        describe: "Run script in all packages with unlimited concurrency, streaming prefixed output",
        type: "boolean",
        default: undefined,
      },
      "npm-client": {
        group: "Command Options:",
        describe: "Executable used to run scripts (npm, yarn, pnpm, ...)",
        type: "string",
        requiresArg: true,
      },
    })
    .positional("script", {
      describe: "The npm script to run. Pass flags to send to the npm client after --",
      type: "string",
    });

class RunCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      parallel: false,
      stream: false,
    });
  }

  initialize(callback) {
    const { script } = this.options;
    this.script = script;
    this.args = this.options["--"] || [];

    if (!script) {
      callback(new Error("You must specify which npm script to run."));
      return;
    }

    const { parallel, stream, npmClient } = this.options;
    this.npmClient = npmClient || "npm";

    const { filteredPackages } = this;

    if (script === "env") {
      this.packagesWithScript = filteredPackages;
    } else {
      this.packagesWithScript = filteredPackages.filter(pkg => pkg.scripts && pkg.scripts[script]);
    }

    if (!this.packagesWithScript.length) {
      this.logger.warn(`No packages found with the npm script '${script}'`);
    }

    if (parallel || stream) {
      // don't interrupt streaming stdio
      this.logger.disableProgress();
    }

    try {
      this.batchedPackages = this.toposort
        ? batchPackages(this.packagesWithScript, this.options.rejectCycles)
        : [this.packagesWithScript];
    } catch (e) {
      return callback(e);
    }

    callback(null, true);
  }

  execute(callback) {
    const finish = err => {
      if (err) {
        callback(err);
      } else {
        if (this.packagesWithScript.length) {
          this.logger.success("run", `Ran npm script '${this.script}' in packages:`);
          this.logger.success("", this.packagesWithScript.map(pkg => `- ${pkg.name}`).join("\n"));
        }
        callback(null, true);
      }
    };

    if (this.options.parallel) {
      this.runScriptInPackagesParallel(finish);
    } else {
      this.runScriptInPackagesBatched(finish);
    }
  }

  runScriptInPackagesBatched(callback) {
    runParallelBatches(
      this.batchedPackages,
      pkg => done => {
        this.runScriptInPackage(pkg, done);
      },
      this.concurrency,
      callback
    );
  }

  runScriptInPackage(pkg, callback) {
    if (this.options.stream) {
      this.runScriptInPackageStreaming(pkg, callback);
    } else {
      this.runScriptInPackageCapturing(pkg, callback);
    }
  }

  runScriptInPackagesParallel(callback) {
    this.logger.info(
      "run",
      "in %d package(s): npm run %s",
      this.packagesWithScript.length,
      [this.script].concat(this.args).join(" ")
    );

    async.parallel(
      this.packagesWithScript.map(pkg => done => {
        this.runScriptInPackageStreaming(pkg, done);
      }),
      callback
    );
  }

  runScriptInPackageStreaming(pkg, callback) {
    npmRunScript.stream(
      this.script,
      {
        args: this.args,
        npmClient: this.npmClient,
        pkg,
      },
      callback
    );
  }

  runScriptInPackageCapturing(pkg, callback) {
    npmRunScript(
      this.script,
      {
        args: this.args,
        npmClient: this.npmClient,
        pkg,
      },
      (err, stdout) => {
        if (err) {
          this.logger.error(this.script, `Errored while running script in '${pkg.name}'`);
        } else {
          output(stdout);
        }
        callback(err);
      }
    );
  }
}
