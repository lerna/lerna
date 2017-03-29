import Command from "../Command";
import chalk from "chalk";
import columnify from "columnify";

export function handler(argv) {
  return new LsCommand(argv._, argv).run();
}

export const command = "ls";

export const describe = "List all public packages";

export const builder = {};

export default class LsCommand extends Command {
  static getSupportedOptions() {
    return Object.assign({}, Command.getSupportedOptions());
  }

  static get describe() {
    return "List all public packages";
  }

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
