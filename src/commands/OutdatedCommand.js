import NpmUtilities from "../NpmUtilities";
import Command from "../Command";
import async from "async";

export default class OutdatedCommand extends Command {
  initialize(callback) {
    this.args = this.input.slice(1);

    if (!this.packages.length) {
      callback(new Error(`No packages found`));
      return;
    }

    callback(null, true);
  }

  execute(callback) {
    this.runOutdatedInPackages(err => {
      if (err) {
        callback(err);
      } else {
        this.logger.success(`Successfully ran npm outdated in all packages`);
        callback(null, true);
      }
    });
  }

  runOutdatedInPackages(callback) {
    async.parallelLimit(this.packages.map(pkg => cb => {
      this.runOutdatedInPackage(pkg, cb);
    }), this.concurrency, callback);
  }

  runOutdatedInPackage(pkg, callback) {
    NpmUtilities.execInDir('outdated', this.args, pkg.location, (err, stdout) => {
      if (err) {
        this.logger.error(`Errored while running npm outdated in '${pkg.name}'`, err);
      } else {
        this.logger.info(`=== ${pkg.name} ===`);
        this.logger.info(stdout);
      }
      callback(err);
    });
  }
}
