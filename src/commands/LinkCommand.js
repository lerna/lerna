"use strict";

const Command = require("../Command");
const PackageUtilities = require("../PackageUtilities");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new LinkCommand(argv);
};

exports.command = "link";

exports.describe = "Symlink together all packages which are dependencies of each other";

exports.builder = {
  "force-local": {
    group: "Command Options:",
    describe: "Force local",
    type: "boolean",
    default: undefined,
  },
};

class LinkCommand extends Command {
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
