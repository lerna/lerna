import chalk from "chalk";
import columnify from "columnify";

import Command from "../Command";
import output from "../utils/output";

export function handler(argv) {
  return new LsCommand(argv._, argv).run();
}

export const command = "ls";

export const describe = "List all public packages";

export const builder = {
  "json": {
    describe: "Show information in JSON format",
    group: "Command Options:",
    type: "boolean",
    default: undefined,
  }
};

export default class LsCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      json: false,
    });
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
          version: pkg.version,
          private: pkg.isPrivate()
        };
      });

    if (this.options.json) {
      output(JSON.stringify(formattedPackages, null, 2));
    } else {
      formattedPackages.forEach((pkg) => {
        pkg.version = chalk.grey(`v${pkg.version}`);
        pkg.private = pkg.private ? `(${chalk.red("private")})` : "";
      });
      output(columnify(formattedPackages, { showHeaders: false }));
    }

    callback(null, true);
  }
}
