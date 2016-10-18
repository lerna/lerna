import Command from "../Command";
import PackageUtilities from "../PackageUtilities";

export default class LsCommand extends Command {
  initialize(callback) {

    if (this.flags.scope) {
      try {
        this.packages = PackageUtilities.filterNonDependentPackages(this.packages, this.flags.scope);
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
