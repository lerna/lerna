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
  }
};

export default class ExecCommand extends Command {
  initialize(callback) {
    this.command = this.input[0];
    this.args = this.input.slice(1);

    if (!this.command) {
      callback(new Error("You must specify which command to run."));
      return;
    }

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
    PackageUtilities.runParallelBatches(this.batchedPackages, (pkg) => (done) => {
      this.runCommandInPackage(pkg, done);
    }, this.concurrency, callback);
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

  runCommandInPackage(pkg, callback) {
    ChildProcessUtilities.spawn(this.command, this.args, this.getOpts(pkg), (err) => {
      if (err && err.code) {
        this.logger.error("exec", `Errored while executing '${err.cmd}' in '${pkg.name}'`);
      }
      callback(err);
    });
  }
}
