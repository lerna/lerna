import Command from "../Command";
import chalk from "chalk";
import columnify from "columnify";

export default class LsCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    const formattedPackages = this.filteredPackages
      .map((pkg) => {
        return {
          name: pkg.name,
          version: chalk.grey(`v${pkg.version}`),
          private: pkg.isPrivate() ? `(${chalk.red("private")})` : ""
        };
      });

    this.logger.info(columnify(formattedPackages, { showHeaders: false }));
    callback(null, true);
  }
}
