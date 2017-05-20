import _ from "lodash";
import chalk from "chalk";

import { builder as publishOptions } from "./PublishCommand";
import Command from "../Command";
import output from "../utils/output";
import UpdatedPackagesCollector from "../UpdatedPackagesCollector";

const updatedOptions = _.assign(
  {},
  publishOptions,
  {
    "json": {
      describe: "Show information in JSON format",
      group: "Command Options:",
      type: "boolean"
    }
  }
);

export function handler(argv) {
  return new UpdatedCommand(argv._, argv).run();
}

export const command = "updated";

export const describe = "Check which packages have changed since the last publish.";

export const builder = (yargs) => yargs.options(updatedOptions);

export default class UpdatedCommand extends Command {
  initialize(callback) {
    const updatedPackagesCollector = new UpdatedPackagesCollector(this);
    this.updates = updatedPackagesCollector.getUpdates();

    const proceedWithUpdates = this.updates.length > 0;
    if (!proceedWithUpdates) {
      this.logger.info("No packages need updating");
    }

    callback(null, proceedWithUpdates);
  }

  get otherCommandConfigs() {
    return ["publish"];
  }

  execute(callback) {
    const updatedPackages = this.updates.map((update) => update.package).map((pkg) => {
      return {
        name: pkg.name,
        version: pkg.version,
        private: pkg.isPrivate()
      };
    });

    this.logger.info("result");
    if (this.options.json) {
      output(JSON.stringify(updatedPackages, null, 2));
    } else {
      const formattedUpdates = updatedPackages.map((pkg) =>
        `- ${pkg.name}${pkg.private ? ` (${chalk.red("private")})` : ""}`
      ).join("\n");
      output(formattedUpdates);
    }

    callback(null, true);
  }
}
