import ChildProcessUtilities from "../ChildProcessUtilities";
import ScopedCommand from "../ScopedCommand";
import async from "async";

export default class ExecCommand extends ScopedCommand {
  initialize(callback) {
    this.command = this.input[0];
    this.args = this.input.slice(1);

    if (!this.command) {
      callback(new Error("You must specify which command to run."));
      return;
    }

    callback(null, true);
  }

  execute(callback) {
    async.parallelLimit(this.packages.map(pkg => cb => {
      this.runCommandInPackage(pkg, cb);
    }), 4, callback);
  }

  runCommandInPackage(pkg, callback) {
    ChildProcessUtilities.spawn(this.command, this.args, { cwd: pkg.location }, (err, stdout) => {
      if (err) {
        this.logger.error(`Errored while running command '${this.command}' ` +
                          `with arguments '${this.args.join(" ")}' in '${pkg.name}'`, err);
      } else {
        this.logger.info(stdout);
      }
      callback(err);
    });
  }
}
