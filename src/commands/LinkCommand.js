import Command from "../Command";
import PackageUtilities from "../PackageUtilities";

export function handler(argv) {
  new LinkCommand([argv.pkg], argv, argv._cwd).run()
    .then(argv._onFinish, argv._onFinish);
}

export const command = "link";

export const describe = "Symlink together all packages which are dependencies of each other";

export const builder = {};

export default class LinkCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize(callback) {
    callback(null, true);
  }

  execute(callback) {
    const {packages, packageGraph, logger} = this;

    PackageUtilities.symlinkPackages(packages, packageGraph, logger, callback);
  }
}
