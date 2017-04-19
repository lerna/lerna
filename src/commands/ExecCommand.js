import ChildProcessUtilities from "../ChildProcessUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";

export function handler(argv) {
  return new ExecCommand([argv.command, ...argv.args], argv).run();
}

export const command = "exec <command> [args..]";

export const describe = "Run an arbitrary command in each package.";

export const builder = {};

export default class ExecCommand extends Command {
  initialize(callback) {
    this.command = this.input[0];
    this.args = this.input.slice(1);

    if (!this.command) {
      callback(new Error("You must specify which command to run."));
      return;
    }

    this.batchedPackages = this.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.filteredPackages)
      : [ this.filteredPackages ];

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
        this.logger.error(`Errored while executing '${err.cmd}' in '${pkg.name}'`);
      }
      callback(err);
    });
  }
}
