import Command from "../Command";
import packageJson from "../../package.json";

export default class VersionCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    this.logger.info(packageJson.version);
    callback(null, true);
  }
}
