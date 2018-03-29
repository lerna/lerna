import async from "async";

import ChildProcessUtilities from "../ChildProcessUtilities";
import Command from "../Command";
import PackageUtilities from "../PackageUtilities";

export function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  const cmd = new ExecCommand([argv.command, ...argv.args], argv, argv._cwd);
  return cmd.run().then(argv._onResolved, argv._onRejected);
}

export const command = "exec <command> [args..]";

export const describe = "Run an arbitrary command in each package.";

export const builder = {
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
    describe: "Run command in all packages with unlimited concurrency, streaming prefixed output",
    type: "boolean",
    default: undefined,
  },
};

export default class ExecCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      bail: true,
      parallel: false,
      prefix: true,
    });
  }

  initialize(callback) {
    const [cmd, ...args] = this.input;
    this.command = cmd;
    this.args = args;

    // don't interrupt spawned or streaming stdio
    this.logger.disableProgress();

    const { filteredPackages } = this;

    try {
      this.batchedPackages = this.toposort
        ? PackageUtilities.topologicallyBatchPackages(filteredPackages, {
            rejectCycles: this.options.rejectCycles,
          })
        : [filteredPackages];
    } catch (e) {
      return callback(e);
    }

    callback(null, true);
  }

  execute(callback) {
    if (this.options.parallel) {
      this.runCommandInPackagesParallel(callback);
    } else {
      PackageUtilities.runParallelBatches(
        this.batchedPackages,
        pkg => done => {
          this.runCommandInPackage(pkg, done);
        },
        this.concurrency,
        callback
      );
    }
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

  runCommandInPackagesParallel(callback) {
    this.logger.info(
      "exec",
      "in %d package(s): %s",
      this.filteredPackages.length,
      [this.command].concat(this.args).join(" ")
    );

    async.parallel(
      this.filteredPackages.map(pkg => done => {
        const prefixStr = this.options.prefix ? pkg.name : "";
        ChildProcessUtilities.spawnStreaming(this.command, this.args, this.getOpts(pkg), prefixStr, done);
      }),
      callback
    );
  }

  runCommandInPackage(pkg, callback) {
    const done = err => {
      if (err && err.code) {
        this.logger.error("exec", `Errored while executing '${err.cmd}' in '${pkg.name}'`);
      }
      callback(err);
    };

    if (this.options.stream) {
      const prefixStr = this.options.prefix ? pkg.name : "";
      ChildProcessUtilities.spawnStreaming(this.command, this.args, this.getOpts(pkg), prefixStr, done);
    } else {
      ChildProcessUtilities.spawn(this.command, this.args, this.getOpts(pkg), done);
    }
  }
}
