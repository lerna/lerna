// @ts-check

"use strict";

const { Command } = require("@lerna/command");
const log = require("npmlog");
const { executeMigrations } = require("nx/src/command-line/migrate");
const migrationsJson = require("../../migrations.json");

module.exports = factory;

function factory(argv) {
  return new RepairCommand(argv);
}

class RepairCommand extends Command {
  // eslint-disable-next-line class-methods-use-this
  initialize() {}

  async execute() {
    const verbose = log.level === "verbose";

    const lernaMigrations = Object.entries(migrationsJson.generators).map(([name, migration]) => {
      return /** @type {const} */ ({
        package: "lerna",
        cli: "nx",
        name,
        description: migration.description,
        version: migration.version,
      });
    });

    const migrationsThatMadeNoChanges = await executeMigrations(
      process.cwd(),
      lernaMigrations,
      verbose,
      false,
      ""
    );

    if (migrationsThatMadeNoChanges.length < lernaMigrations.length) {
      // @ts-ignore
      this.logger.info("repair", `Successfully repaired your configuration. This workspace is up to date!`);
    } else {
      // @ts-ignore
      this.logger.info("repair", `No changes were necessary. This workspace is up to date!`);
    }
  }
}

module.exports.RepairCommand = RepairCommand;
