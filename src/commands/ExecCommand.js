import ChildProcessUtilities from "../ChildProcessUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";

export default class ExecCommand extends Command {
  initialize(callback) {
    this.command = this.input[0];
    this.args = this.input.slice(1);

    if (!this.command) {
      callback(new Error("You must specify which command to run."));
      return;
    }

    this.batchedPackages = this.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.filteredPackages, { logger: this.logger })
      : [ this.filteredPackages ];

    callback(null, true);
  }

  execute(callback) {
    PackageUtilities.runParallelBatches(this.batchedPackages, (pkg) => (done) => {
      this.runCommandInPackage(pkg, done);
    }, this.concurrency, callback);
  }

  runCommandInPackage(pkg, callback) {
    ChildProcessUtilities.spawn(this.command, this.args, {
      cwd: pkg.location,
      env: Object.assign({}, process.env, { LERNA_PACKAGE_NAME: pkg.name })
    }, (code) => {
      if (code) {
        this.logger.error(`Errored while running command '${this.command}' ` +
                          `with arguments '${this.args.join(" ")}' in '${pkg.name}'`);
      }
      callback(code);
    });
  }
}
