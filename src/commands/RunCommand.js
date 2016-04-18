import NpmUtilities from "../NpmUtilities";
import Command from "../Command";
import async from "async";

export default class RunCommand extends Command {
  initialize(callback) {
    this.script = this.input[0];
    this.args = this.input.slice(1);

    if (!this.script) {
      this.logger.error("You must specify which npm script to run.");
      this.exit(1);
      return;
    }

    this.packagesWithScript = this.packages
      .filter(pkg => pkg.scripts && pkg.scripts[this.script]);

    if (!this.packagesWithScript.length) {
      this.logger.warning(`No packages found with the npm script '${this.script}'`);
      this.exit(1);
      return;
    }

    callback();
  }

  execute() {
    this.runScriptInPackages(err => {
      if (err) {
        this.exit(1);
      } else {
        this.logger.success(`Successfully ran npm script '${this.script}' in packages:`);
        this.logger.success(this.packagesWithScript.map(pkg => `- ${pkg.name}`).join("\n"));
        this.exit(0);
      }
    });
  }

  runScriptInPackages(callback) {
    async.parallelLimit(this.packagesWithScript.map(pkg => cb => {
      this.runScriptInPackage(pkg, cb);
    }), 4, callback);
  }

  runScriptInPackage(pkg, callback) {
    NpmUtilities.runScriptInDir(this.script, this.args, pkg.location, (err, stdout) => {
      if (err) {
        this.logger.error(`Errored while running npm script '${this.script}' in '${pkg.name}'`, err);
      } else {
        this.logger.info(stdout);
      }
      callback(err);
    });
  }
}
