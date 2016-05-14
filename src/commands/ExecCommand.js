import NpmUtilities from "../NpmUtilities";
import Command from "../Command";
import async from "async";

export default class ExecCommand extends Command {
  initialize(callback) {
    this.command = this.input[0];
    this.args = this.input.slice(1);

    if (!this.command) {
      callback(new Error("You must specify which npm command to run."));
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
    NpmUtilities.execInDir(this.command, this.args, pkg.location, (err, stdout) => {
      if (err) {
        this.logger.error(`Errored while running npm command '${this.command}' in '${pkg.name}'`, err);
      } else {
        this.logger.info(stdout);
      }
      callback(err);
    });
  }
}
