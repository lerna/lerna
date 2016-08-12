import NpmUtilities from "../NpmUtilities";
import Command from "../Command";
import PackageUtilities from "../PackageUtilities";
import async from "async";

export default class RunCommand extends Command {
  initialize(callback) {
    this.script = this.input[0];
    this.args = this.input.slice(1);

    if (!this.script) {
      callback(new Error("You must specify which npm script to run."));
      return;
    }

    this.packagesWithScript = this.packages
      .filter((pkg) => pkg.scripts && pkg.scripts[this.script]);

    if (!this.packagesWithScript.length) {
      callback(new Error(`No packages found with the npm script '${this.script}'`));
      return;
    }

    if (this.flags.scope) {
      this.logger.info(`Scoping to packages that match '${this.flags.scope}'`);
      try {
        this.packagesWithScript = PackageUtilities.filterPackages(this.packagesWithScript, this.flags.scope);
      } catch (err) {
        callback(err);
        return;
      }
    }

    callback(null, true);
  }

  execute(callback) {
    this.runScriptInPackages((err) => {
      if (err) {
        callback(err);
      } else {
        this.logger.success(`Successfully ran npm script '${this.script}' in packages:`);
        this.logger.success(this.packagesWithScript.map((pkg) => `- ${pkg.name}`).join("\n"));
        callback(null, true);
      }
    });
  }

  runScriptInPackages(callback) {
    async.parallelLimit(this.packagesWithScript.map((pkg) => (cb) => {
      this.runScriptInPackage(pkg, cb);
    }), this.concurrency, callback);
  }

  runScriptInPackage(pkg, callback) {
    NpmUtilities.runScriptInDir(this.script, this.args, pkg.location, (err, stdout) => {
      this.logger.info(stdout);
      if (err) {
        this.logger.error(`Errored while running npm script '${this.script}' in '${pkg.name}'`, err);
      }
      callback(err);
    });
  }
}
