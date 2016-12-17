import ChildProcessUtilities from "../ChildProcessUtilities";
import Command from "../Command";
import async from "async";

export default class ExecCommand extends Command {
  initialize(callback) {
    this.command = this.input[0];
    this.args = this.input.slice(1);

    if (!this.command) {
      callback(new Error("You must specify which command to run."));
      return;
    }

    this.batchedPackages = this.flags.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.filteredPackages, this.logger)
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
      env: process.env
    }, (code) => {
      if (code) {
        this.logger.error(`Errored while running command '${this.command}' ` +
                          `with arguments '${this.args.join(" ")}' in '${pkg.name}'`);
      }
      callback(code);
    });
  }
}
