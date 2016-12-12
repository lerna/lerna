// @flow

import UpdatedPackagesCollector from "../UpdatedPackagesCollector";
import type {Update} from "../UpdatedPackagesCollector";
import Command from "../Command";

export default class UpdatedCommand extends Command {
  updates: Array<Update>;

  initialize(callback: Function) {
    const updatedPackagesCollector = new UpdatedPackagesCollector(
      this.packages,
      this.packageGraph,
      this.flags,
      this.repository.publishConfig
    );

    this.updates = updatedPackagesCollector.getUpdates();
    callback(null, true);
  }

  execute(callback: Function) {
    const formattedUpdates = this.updates
      .map((update) => `- ${update.package.name}${update.package.isPrivate() ? " (private)" : ""}`)
      .join("\n");

    this.logger.newLine();
    this.logger.info(formattedUpdates);
    this.logger.newLine();
    callback(null, true);
  }
}
