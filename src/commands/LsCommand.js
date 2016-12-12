// @flow

import Command from "../Command";
import chalk from "chalk";

export default class LsCommand extends Command {
  initialize(callback: Function) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback: Function) {
    const formattedPackages = this.packages
      .map((pkg) => `- ${pkg.name}${pkg.isPrivate() ? ` (${chalk.red("private")})` : ""}`)
      .join("\n");

    this.logger.info(formattedPackages);
    callback(null, true);
  }
}
