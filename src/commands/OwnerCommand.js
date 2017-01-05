import Command from "../Command";
import NpmUtilities from "../NpmUtilities";
import ConfigUtilities from "../ConfigUtilities";
import async from "async";
import logger from "../logger";

const COMMAND_REQUIRED_ERROR_MESSAGE = "You must specify which command to run, and it must be one of: add, rm";
const OWNER_NOT_FOUND_ERROR_FRAGMENT = " is not listed as an owner in lerna.json; did you spell it correctly?";
const RM_COMMAND_NAME = "rm";
const ADD_COMMAND_NAME = "add";

export default class OwnerCommand extends Command {
  initialize(callback) {
    this.command = this.input[0];
    this.ownerName = this.input[1];

    if (!this.command || [RM_COMMAND_NAME, ADD_COMMAND_NAME].indexOf(this.command) < 0) {
      callback(new Error(COMMAND_REQUIRED_ERROR_MESSAGE));
      return;
    }

    callback(null, true);
  }

  execute(callback) {
    // Note that we will be mutating object keys, just not the reference.
    const config = ConfigUtilities.readSync(this.repository.rootPath);

    // There's a lot of legacy lerna.jsons that don't have an owner hash, and we
    // don't include an owners hash on init.
    if (!config.owners) {
      config.owners = [];
    }

    // We could use array.includes instead, but this has the added benefit of
    // removing duplicate owners from lerna.json.
    const ownersSet = new Set(config.owners);

    switch (this.command) {
    case ADD_COMMAND_NAME:
      ownersSet.add(this.ownerName);
      break;
    case RM_COMMAND_NAME:
      if (ownersSet.has(this.ownerName)) {
        ownersSet.delete(this.ownerName);
      } else {
        logger.warn(this.ownerName + OWNER_NOT_FOUND_ERROR_FRAGMENT);
      }
      break;
    default:
      return callback(new Error(COMMAND_REQUIRED_ERROR_MESSAGE));
    }

    // Coerce to an array and write
    config.owners = [...ownersSet];
    ConfigUtilities.writeSync(this.repository.rootPath, config);

    // Add or remove the owner from each public package, since private packages
    // won't be in the configured registry.
    async.parallelLimit(this.filteredPackages.map((pkg) => (cb) => {
      this.runCommandInPackage(pkg, cb);
    }), this.concurrency, callback);
  }

  runCommandInPackage(pkg, callback) {
    switch (this.command) {
    case ADD_COMMAND_NAME:
      NpmUtilities.addOwner(this.ownerName, pkg.name);
      this.logger.info(`Added owner ${this.ownerName} to package ${pkg.name}`);
      return callback(null, true);
    case RM_COMMAND_NAME:
      NpmUtilities.removeOwner(this.ownerName, pkg.name);
      this.logger.info(`Removed owner ${this.ownerName} to package ${pkg.name}`);
      return callback(null, true);
    default:
      return callback(new Error(COMMAND_REQUIRED_ERROR_MESSAGE));
    }
  }
}
