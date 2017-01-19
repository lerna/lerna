import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";

export default class RunCommand extends Command {
  initialize(callback) {
    this.script = this.input[0];
    this.args = this.input.slice(1);

    if (!this.script) {
      callback(new Error("You must specify which npm script to run."));
      return;
    }

    this.packagesWithScript = this.filteredPackages
      .filter((pkg) => pkg.scripts && pkg.scripts[this.script]);

    if (!this.packagesWithScript.length) {
      callback(new Error(`No packages found with the npm script '${this.script}'`));
      return;
    }

    this.batchedPackages = this.flags.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.packagesWithScript, this.logger)
      : [ this.packagesWithScript ];

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
    PackageUtilities.runParallelBatches(this.batchedPackages, (pkg) => (done) => {
      this.runScriptInPackage(pkg, done);
    }, this.concurrency, callback);
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
