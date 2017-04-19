import chalk from "chalk";
import Command from "../Command";
import output from "../utils/output";
import { builder as publishOptions } from "./PublishCommand";
import UpdatedPackagesCollector from "../UpdatedPackagesCollector";

export function handler(argv) {
  return new UpdatedCommand(argv._, argv).run();
}

export const command = "updated";

export const describe = "Check which packages have changed since the last publish.";

export const builder = (yargs) => yargs.options(publishOptions);

export default class UpdatedCommand extends Command {
  initialize(callback) {
    const updatedPackagesCollector = new UpdatedPackagesCollector(this);
    this.updates = updatedPackagesCollector.getUpdates();
    callback(null, true);
  }

  get otherCommandConfigs() {
    return ["publish"];
  }

  execute(callback) {
    const formattedUpdates = this.updates.map((update) => update.package).map((pkg) =>
      `- ${pkg.name}${pkg.isPrivate() ? ` (${chalk.red("private")})` : ""}`
    ).join("\n");

    output("");
    output(formattedUpdates);
    output("");

    callback(null, true);
  }
}
