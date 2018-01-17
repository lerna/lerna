"use strict";

const async = require("async");

const Command = require("../Command");
const NpmUtilities = require("../NpmUtilities");
const output = require("../utils/output");
const PackageUtilities = require("../PackageUtilities");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new RunCommand(argv);
};

exports.command = "run <script> [args..]";

exports.describe = "Run an npm script in each package that contains that script.";

exports.builder = {
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
};

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
    const { script, args } = this.options;
    this.script = script;
    this.args = args;

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
        ? PackageUtilities.topologicallyBatchPackages(this.packagesWithScript, {
            rejectCycles: this.options.rejectCycles,
          })
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
    PackageUtilities.runParallelBatches(
      this.batchedPackages,
      pkg => done => {
        this.runScriptInPackage(pkg, done);
      },
      this.concurrency,
      callback,
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
      [this.script].concat(this.args).join(" "),
    );

    async.parallel(
      this.packagesWithScript.map(pkg => done => {
        this.runScriptInPackageStreaming(pkg, done);
      }),
      callback,
    );
  }

  runScriptInPackageStreaming(pkg, callback) {
    NpmUtilities.runScriptInPackageStreaming(
      this.script,
      {
        args: this.args,
        pkg,
        npmClient: this.npmClient,
      },
      callback,
    );
  }

  runScriptInPackageCapturing(pkg, callback) {
    NpmUtilities.runScriptInDir(
      this.script,
      {
        args: this.args,
        directory: pkg.location,
        npmClient: this.npmClient,
      },
      (err, stdout) => {
        if (err) {
          this.logger.error(this.script, `Errored while running script in '${pkg.name}'`);
        } else {
          output(stdout);
        }
        callback(err);
      },
    );
  }
}
