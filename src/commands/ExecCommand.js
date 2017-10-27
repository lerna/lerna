import async from "async";

import ChildProcessUtilities from "../ChildProcessUtilities";
import Command from "../Command";
import PackageUtilities from "../PackageUtilities";

export function handler(argv) {
  new ExecCommand([argv.command, ...argv.args], argv, argv._cwd).run()
    .then(argv._onFinish, argv._onFinish);
}

export const command = "exec <command> [args..]";

export const describe = "Run an arbitrary command in each package.";

export const builder = {
  "bail": {
    group: "Command Options:",
    describe: "Bail on exec execution when the command fails within a package",
    type: "boolean",
    default: undefined,
  },
  "parallel": {
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
    });
  }

  initialize(callback) {
    this.command = this.input[0];
    this.args = this.input.slice(1);

    // don't interrupt spawned or streaming stdio
    this.logger.disableProgress();

    const { filteredPackages } = this;

    try {
    this.batchedPackages = this.toposort
      ? PackageUtilities.topologicallyBatchPackages(filteredPackages, {
        rejectCycles: this.options.rejectCycles
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
      PackageUtilities.runParallelBatches(this.batchedPackages, (pkg) => (done) => {
        this.runCommandInPackage(pkg, done);
      }, this.concurrency, callback);
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
      reject: this.options.bail
    };
  }

  runCommandInPackagesParallel(callback) {
    this.logger.info(
      "exec",
      "in %d package(s): %s",
      this.filteredPackages.length,
      [this.command].concat(this.args).join(" ")
    );

    async.parallel(this.filteredPackages.map((pkg) => (done) => {
      ChildProcessUtilities.spawnStreaming(
        this.command, this.args, this.getOpts(pkg), pkg.name, done
      );
    }), callback);
  }

  runCommandInPackage(pkg, callback) {
    ChildProcessUtilities.spawn(this.command, this.args, this.getOpts(pkg), (err) => {
      if (err && err.code) {
        this.logger.error("exec", `Errored while executing '${err.cmd}' in '${pkg.name}'`);
      }
      callback(err);
    });
  }
}
