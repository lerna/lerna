import async from "async";

import Command from "../Command";
import NpmUtilities from "../NpmUtilities";
import output from "../utils/output";
import PackageUtilities from "../PackageUtilities";

export function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  const cmd = new RunCommand([argv.script, ...argv.args], argv, argv._cwd);
  return cmd.run().then(argv._onResolved, argv._onRejected);
}

export const command = "run <script> [args..]";

export const describe = "Run an npm script in each package that contains that script.";

export const builder = {
  stream: {
    group: "Command Options:",
    describe: "Stream output with lines prefixed by package.",
    type: "boolean",
    default: undefined,
  },
  // This option controls prefix for stream output so that it can be disabled to be friendly
  // to tools like Visual Studio Code to highlight the raw results
  prefix: {
    group: "Command Options:",
    describe: "Enable prefix for stream output",
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

export default class RunCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      parallel: false,
      stream: false,
      prefix: true,
    });
  }

  initialize(callback) {
    const [script, ...args] = this.input;
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
    NpmUtilities.runScriptInPackageStreaming(
      this.script,
      {
        args: this.args,
        pkg,
        npmClient: this.npmClient,
        prefix: this.options.prefix,
      },
      callback
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
      }
    );
  }
}
