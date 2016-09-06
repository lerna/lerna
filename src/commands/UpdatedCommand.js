import UpdatedPackagesCollector from "../UpdatedPackagesCollector";
import Command from "../Command";

export default class UpdatedCommand extends Command {
  initialize(callback) {
    const updatedPackagesCollector = new UpdatedPackagesCollector(
      this.repository,
      this.flags,
      this.repository.publishConfig
    );

    this.updates = updatedPackagesCollector.getUpdates();
    callback(null, true);
  }

  execute(callback) {
    const formattedUpdates = this.updates
      .map((update) => `- ${update.package.name}${update.package.isPrivate() ? " (private)" : ""}`)
      .join("\n");

    this.logger.newLine();
    this.logger.info(formattedUpdates);
    this.logger.newLine();
    callback(null, true);
  }
}
