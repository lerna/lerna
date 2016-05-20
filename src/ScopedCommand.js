import Command from "./Command";
import minimatch from "minimatch";

export default class ScopedCommand extends Command {
  runPreparations() {
    super.runPreparations();

    const scopeGlob = this.flags.scope;

    try {
      if (typeof scopeGlob !== "undefined") {
        this.logger.info(`Scoping to packages that match '${scopeGlob}'`);
        this.packages = this.packages
          .filter(pkg => minimatch(pkg.name, scopeGlob));

        if (!this.packages.length) {
          throw new Error(`No packages found that match '${scopeGlob}'`);
        }
      }
    } catch (err) {
      this.logger.error(`Errored while applying scope '${scopeGlob}'`, err);
      this._complete(null, 1);
      throw err;
    }
  }
}
