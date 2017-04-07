import UpdatedPackagesCollector from "../UpdatedPackagesCollector";
import { builder as publishOptions } from "./PublishCommand";
import Command from "../Command";
import chalk from "chalk";

export function handler(argv) {
  return new UpdatedCommand(argv._, argv).run();
}

export const command = "updated";

export const describe = "Check which packages have changed since the last release (the last git tag).";

export const builder = Object.assign({}, publishOptions);

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

    this.logger.newLine();
    this.logger.info(formattedUpdates);
    this.logger.newLine();
    callback(null, true);
  }
}
