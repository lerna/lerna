import UpdatedPackagesCollector from "../UpdatedPackagesCollector";
import Command from "../Command";

export default class UpdatedCommand extends Command {
  initialize(callback) {
    const updatedPackagesCollector = new UpdatedPackagesCollector(
      this.packages,
      this.packageGraph,
      process.env.FORCE_VERSION,
      this.flags
    );

    this.updates = updatedPackagesCollector.getUpdates();
    callback();
  }

  execute() {
    const formattedUpdates = this.updates
      .map(update => `- ${update.package.name}`)
      .join("\n");

    this.logger.newLine();
    this.logger.info(formattedUpdates);
    this.logger.newLine();
  }
}
