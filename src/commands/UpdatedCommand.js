import UpdatedPackagesCollector from "../UpdatedPackagesCollector";
import Command from "../Command";

export default class UpdatedCommand extends Command {
  initialize(callback) {
    const updatedPackagesCollector = new UpdatedPackagesCollector(
      this.packages,
      this.packageGraph,
      this.flags,
      this.repository.publishConfig
    );

    this.updates = updatedPackagesCollector.getUpdates();
    callback(null, true);
  }

  execute(callback) {
    const formattedUpdates = this.updates
      .map((update) => `- ${update.package.name}`)
      .join("\n");

    this.logger.newLine();
    this.logger.info(formattedUpdates);
    this.logger.newLine();
    callback(null, true);
  }
}
