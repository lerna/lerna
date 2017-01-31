import UpdatedPackagesCollector from "../UpdatedPackagesCollector";
import Command from "../Command";
import chalk from "chalk";

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
    const formattedUpdates = this.updates
      .map((update) => `- ${update.package.name}${update.package.isPrivate() ? ` (${chalk.red("private")})` : ""}`)
      .join("\n");

    this.logger.newLine();
    this.logger.info(formattedUpdates);
    this.logger.newLine();
    callback(null, true);
  }
}
