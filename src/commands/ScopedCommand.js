import Command from "../Command";
import minimatch from "minimatch";

export default class ScopedCommand extends Command {
  runPreparations() {
    super.runPreparations();

    const restrictionFlag = this.flags.scope;

    try {
      if (typeof restrictionFlag !== "undefined") {
        this.logger.info(`Scoping to packages that match '${restrictionFlag}'`);
        this.packages = this.packages
          .filter(pkg => minimatch(pkg.name, restrictionFlag));

        if (!this.packages.length) {
          throw new Error(`No packages found that match '${restrictionFlag}'`);
        }
      }
    } catch (err) {
      this.logger.error(`Errored while applying scope '${restrictionFlag}'`, err);
      this._complete(null, 1);
      throw err;
    }
  }
}
