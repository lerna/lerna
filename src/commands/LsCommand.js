import Command from "../Command";

export default class LsCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    const formattedPackages = this.packages
      .filter((pkg) => !pkg.isPrivate())
      .map((pkg) => `- ${pkg.name}`)
      .join("\n");

    this.logger.info(formattedPackages);
    callback(null, true);
  }
}
