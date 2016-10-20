import Command from "../Command";
import PackageUtilities from "../PackageUtilities";

export default class LsCommand extends Command {
  initialize(callback) {
    if (this.input.length) {
      const inputPackage = this.input[0];
      if (!this.packageGraph.get(inputPackage)) {
        callback(new Error(`The package ${inputPackage} does not exist`));
        return;
      }

      try {
        this.packages = PackageUtilities.filterNonDependentPackages(this.packages, this.packageGraph, inputPackage);
      } catch (err) {
        callback(err);
        return;
      }
    }

    callback(null, true);
  }

  execute(callback) {
    const formattedPackages = this.packages
      .filter((pkg) => !pkg.isPrivate())
      .map((pkg) => `${pkg.name}`)
      .join("\n");

    this.logger.info(formattedPackages);
    callback(null, true);
  }
}
