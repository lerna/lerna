import Command from "../Command";
import PackageUtilities from "../PackageUtilities";

export function handler(argv) {
  return new LinkCommand(argv._, argv).run();
}

export const command = "link";

export const describe = "Symlink together all packages which are dependencies of each other";

export const builder = {};

export default class LinkCommand extends Command {
  get defaultOptions() {
    return {};
  }

  initialize(callback) {
    this.exact = this.options.exact;

    callback(null, true);
  }

  execute(callback) {
    const {packages, packageGraph, logger} = this;

    PackageUtilities.symlinkPackages(packages, packageGraph, logger, callback);
  }
}
