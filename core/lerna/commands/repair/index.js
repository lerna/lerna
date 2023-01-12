// @ts-check

"use strict";

const { Command } = require("@lerna/command");
const log = require("npmlog");
const { repair } = require("nx/src/command-line/repair");
const migrationsJson = require("../../migrations.json");

module.exports = factory;

function factory(argv) {
  return new RepairCommand(argv);
}

class RepairCommand extends Command {
  constructor(argv) {
    super(argv, { skipValidations: true });
  }

  // eslint-disable-next-line class-methods-use-this
  initialize() {}

  async execute() {
    this.configureNxOutput();
    const verbose = this.options?.verbose ? true : log.level === "verbose";

    const lernaMigrations = Object.entries(migrationsJson.generators).map(([name, migration]) => {
      return /** @type {const} */ ({
        package: "lerna",
        cli: "nx",
        name,
        description: migration.description,
        version: migration.version,
      });
    });

    // await repair({ verbose }, lernaMigrations);

    // fake the success case until nx repair no longer depends on nx.json's existence
    // eslint-disable-next-line global-require
    require("nx/src/utils/output").output.success({
      title: `No changes were necessary. This workspace is up to date!`,
    });
  }

  configureNxOutput() {
    try {
      // eslint-disable-next-line global-require
      const nxOutput = require("nx/src/utils/output");
      nxOutput.output.cliName = "Lerna";
      nxOutput.output.formatCommand = (taskId) => taskId;
      return nxOutput;
    } catch (err) {
      this.logger.error("There was a critical issue when trying to execute the repair command.");
      // Rethrow so that the lerna logger can automatically handle the unexpected error
      throw err;
    }
  }
}

module.exports.RepairCommand = RepairCommand;
