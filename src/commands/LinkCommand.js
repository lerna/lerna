import Command from "../Command";
import PackageUtilities from "../PackageUtilities";

export function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  const cmd = new LinkCommand([argv.pkg], argv, argv._cwd);
  return cmd.run().then(argv._onResolved, argv._onRejected);
}

export const command = "link";

export const describe = "Symlink together all packages which are dependencies of each other";

export const builder = {
  "force-local": {
    group: "Command Options:",
    describe: "Force local",
    type: "boolean",
    default: undefined,
  },
};

export default class LinkCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      forceLocal: false,
    });
  }

  initialize(callback) {
    callback(null, true);
  }

  execute(callback) {
    const { packages, packageGraph, logger, options: { forceLocal } } = this;
    PackageUtilities.symlinkPackages(packages, packageGraph, logger, forceLocal, callback);
  }
}
