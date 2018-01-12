import _ from "lodash";
import chalk from "chalk";

import { builder as publishOptions } from "./PublishCommand";
import Command from "../Command";
import output from "../utils/output";
import UpdatedPackagesCollector from "../UpdatedPackagesCollector";

const updatedOptions = _.assign({}, publishOptions, {
  json: {
    describe: "Show information in JSON format",
    group: "Command Options:",
    type: "boolean",
    default: undefined,
  },
});

export function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  const cmd = new UpdatedCommand(argv._, argv, argv._cwd);
  return cmd.run().then(argv._onResolved, argv._onRejected);
}

export const command = "updated";

export const describe = "Check which packages have changed since the last publish.";

export const builder = yargs => yargs.options(updatedOptions);

export default class UpdatedCommand extends Command {
  initialize(callback) {
    const updatedPackagesCollector = new UpdatedPackagesCollector(this);
    this.updates = updatedPackagesCollector.getUpdates();

    const proceedWithUpdates = this.updates.length > 0;
    if (!proceedWithUpdates) {
      this.logger.info("No packages need updating");
    }

    callback(null, proceedWithUpdates, 1);
  }

  get otherCommandConfigs() {
    return ["publish"];
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      json: false,
    });
  }

  execute(callback) {
    const updatedPackages = this.updates.map(update => update.package).map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      private: pkg.isPrivate(),
    }));

    this.logger.info("result");
    if (this.options.json) {
      output(JSON.stringify(updatedPackages, null, 2));
    } else {
      const formattedUpdates = updatedPackages
        .map(pkg => `- ${pkg.name}${pkg.private ? ` (${chalk.red("private")})` : ""}`)
        .join("\n");
      output(formattedUpdates);
    }

    callback(null, true);
  }
}
