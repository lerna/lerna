import ChildProcessUtilities from "../ChildProcessUtilities";
import Command from "../Command";
import PackageUtilities from "../PackageUtilities";
import async from "async";

export default class ExecCommand extends Command {
  initialize(callback) {
    this.command = this.input[0];
    this.args = this.input.slice(1);

    if (!this.command) {
      callback(new Error("You must specify which command to run."));
      return;
    }

    if (this.flags.scope) {
      this.logger.info(`Scoping to packages that match '${this.flags.scope}'`);
      try {
        this.packages = PackageUtilities.filterPackages(this.packages, this.flags.scope);
      } catch (err) {
        callback(err);
        return;
      }
    }

    callback(null, true);
  }

  execute(callback) {
    async.parallelLimit(this.packages.map((pkg) => (cb) => {
      this.runCommandInPackage(pkg, cb);
    }), this.concurrency, callback);
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
