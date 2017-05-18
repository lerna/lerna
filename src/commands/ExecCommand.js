import async from "async";

import ChildProcessUtilities from "../ChildProcessUtilities";

import Command from "../Command";
import PackageUtilities from "../PackageUtilities";
import UpdatedPackagesCollector from "../UpdatedPackagesCollector";

export function handler(argv) {
  return new ExecCommand([argv.command, ...argv.args], argv).run();
}

export const command = "exec <command> [args..]";

export const describe = "Run an arbitrary command in each package.";

export const builder = {
  "only-updated": {
    "describe": "When executing scripts/commands, only run the script/command on packages which "
    + "have been updated since the last release"
  },
  "parallel": {
    group: "Command Options:",
    describe: "Run command in all packages with unlimited concurrency, streaming prefixed output",
    type: "boolean",
  },
};

export default class ExecCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize(callback) {
    this.command = this.input[0];
    this.args = this.input.slice(1);

    if (!this.command) {
      callback(new Error("You must specify which command to run."));
      return;
    }

    // don't interrupt spawned or streaming stdio
    this.logger.disableProgress();

    let filteredPackages = this.filteredPackages;
    if (this.flags.onlyUpdated) {
      const updatedPackagesCollector = new UpdatedPackagesCollector(this);
      const packageUpdates = updatedPackagesCollector.getUpdates();
      filteredPackages = PackageUtilities.filterPackagesThatAreNotUpdated(
        filteredPackages,
        packageUpdates
      );
    }

    this.batchedPackages = this.toposort
      ? PackageUtilities.topologicallyBatchPackages(filteredPackages)
      : [this.filteredPackages];

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
      }),
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
