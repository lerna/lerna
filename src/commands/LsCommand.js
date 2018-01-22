import chalk from "chalk";
import columnify from "columnify";

import Command from "../Command";
import output from "../utils/output";

export function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  const cmd = new LsCommand(argv._, argv, argv._cwd);
  return cmd.run().then(argv._onResolved, argv._onRejected);
}

export const command = "ls";

export const describe = "List all public packages";

export const builder = {
  json: {
    describe: "Show information in JSON format",
    group: "Command Options:",
    type: "boolean",
    default: undefined,
  },
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
    const formattedPackages = this.filteredPackages.map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      private: pkg.isPrivate(),
    }));

    if (this.options.json) {
      output(JSON.stringify(formattedPackages, null, 2));
    } else {
      formattedPackages.forEach(pkg => {
        pkg.version = pkg.version ? chalk.grey(`v${pkg.version}`) : chalk.yellow("MISSING");
        pkg.private = pkg.private ? `(${chalk.red("private")})` : "";
      });
      output(
        columnify(formattedPackages, {
          showHeaders: false,
          config: {
            version: {
              align: "right",
            },
          },
        })
      );
    }

    callback(null, true);
  }
}
