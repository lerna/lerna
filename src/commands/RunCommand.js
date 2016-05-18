import NpmUtilities from "../NpmUtilities";
import Command from "../Command";
import async from "async";
import minimatch from "minimatch";

export default class RunCommand extends Command {
  initialize(callback) {
    this.script = this.input[0];
    this.args = this.input.slice(1);

    if (!this.script) {
      callback(new Error("You must specify which npm script to run."));
      return;
    }

    let packagesToRunCommandIn = this.packages;

    if (this.flags.restrictTo) {
        this.logger.info(`Restricting to packages that match '${this.flags.restrictTo}'`);
        packagesToRunCommandIn = packagesToRunCommandIn
            .filter(pkg => minimatch(pkg.name, this.flags.restrictTo));
    }

    if (!packagesToRunCommandIn.length) {
      callback(new Error(`No packages found that match '${this.flags.restrictTo}'`));
      return;
    }

    this.packagesWithScript = packagesToRunCommandIn
      .filter(pkg => pkg.scripts && pkg.scripts[this.script]);

    if (!this.packagesWithScript.length) {
      callback(new Error(`No packages found with the npm script '${this.script}'`));
      return;
    }

    callback(null, true);
  }

  execute(callback) {
    this.runScriptInPackages(err => {
      if (err) {
        callback(err);
      } else {
        this.logger.success(`Successfully ran npm script '${this.script}' in packages:`);
        this.logger.success(this.packagesWithScript.map(pkg => `- ${pkg.name}`).join("\n"));
        callback(null, true);
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
