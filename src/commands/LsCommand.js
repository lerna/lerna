import Command from "../Command";
import chalk from "chalk";

export default class LsCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    const formattedPackages = this.filteredPackages
      .map((pkg) => `- ${pkg.name}${pkg.isPrivate() ? ` (${chalk.red("private")})` : ""}`)
      .join("\n");

    this.logger.info(formattedPackages);
    callback(null, true);
  }
}
