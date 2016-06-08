import Command from "../Command";
import ChildProcessUtilities from "../ChildProcessUtilities";
import PromptUtilities from "../PromptUtilities";
import progressBar from "../progressBar";

export default class CleanCommand extends Command {
  initialize(callback) {
    this.logger.info(`About remove the following directories:\n${
      this.packages.map(pkg => "- " + pkg.nodeModulesLocation).join("\n")
    }`);
    PromptUtilities.confirm("Proceed?", confirmed => {
      if (confirmed) {
        callback(null, true);
      } else {
        this.logger.info("Okay bye!");
        callback(null, false);
      }
    });
  }

  execute(callback) {
    progressBar.init(this.packages.length);
    this.packages.forEach(pkg => {
      progressBar.tick(pkg.name);

      ChildProcessUtilities.execSync("rm -rf " + pkg.nodeModulesLocation);
    });
    progressBar.terminate();
    this.logger.info("All clean!");
    callback(null, true);
  }
}
