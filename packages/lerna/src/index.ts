// Plugin isolation is not relevant to lerna
process.env["NX_ISOLATE_PLUGINS"] = "false";
process.env["NX_TUI"] = "false";

// Currently external until the usage of LERNA_MODULE_DATA can be refactored
const createCmd = require("@lerna/create/command");

// Bundled
import { lernaCLI, log } from "@lerna/core";
import changedCmd from "@lerna/commands/changed/command";
import cleanCmd from "@lerna/commands/clean/command";
import diffCmd from "@lerna/commands/diff/command";
import execCmd from "@lerna/commands/exec/command";
import importCmd from "@lerna/commands/import/command";
import infoCmd from "@lerna/commands/info/command";
import initCmd from "@lerna/commands/init/command";
import listCmd from "@lerna/commands/list/command";
import publishCmd from "@lerna/commands/publish/command";
import runCmd from "@lerna/commands/run/command";
import versionCmd from "@lerna/commands/version/command";

import addCachingCmd from "./commands/add-caching/command";
import repairCmd from "./commands/repair/command";
import watchCmd from "./commands/watch/command";

// Evaluated at runtime to grab the current lerna version
const pkg = require("../package.json");

module.exports = function main(argv: NodeJS.Process["argv"]) {
  const context = {
    lernaVersion: pkg.version,
  };

  const cli = lernaCLI()
    .command(addCachingCmd)
    .command(changedCmd)
    .command(cleanCmd)
    .command(createCmd)
    .command(diffCmd)
    .command(execCmd)
    .command(importCmd)
    .command(infoCmd)
    .command(initCmd)
    .command(listCmd)
    .command(publishCmd)
    .command(repairCmd)
    .command(runCmd)
    .command(watchCmd)
    .command(versionCmd);

  explicitlyHandleLegacyPackageManagementCommands(cli);

  return cli.parse(argv, context);
};

/**
 * Legacy package management commands were finally removed in v9, after over 2 years of being deprecated
 * and not actively maintained (from v7 onwards).
 *
 * To provide clear feedback to folks trying to run those commands, we add "shell" commands that will
 * explain the situation and exit without doing anything.
 */
function explicitlyHandleLegacyPackageManagementCommands(yargsInstance: ReturnType<typeof lernaCLI>) {
  ["add", "bootstrap", "link"].forEach((commandName) => {
    yargsInstance.command({
      command: commandName === "add" ? "add <pkg> [globs..]" : commandName,
      describe: `The "${commandName}" command was removed by default in v7, and is no longer maintained.`,
      builder: (yargs) => {
        /**
         * Dynamically parse all given flags and apply them as options, so that our handler() is always called,
         * rather than yargs showing options based validation messaging.
         */
        const parsed = require("yargs/yargs")(process.argv.slice(2)).argv;
        for (const x of Object.keys(parsed)) {
          if (x !== "_" && x !== "$0") {
            yargs.option(x, {});
          }
        }
        return yargs;
      },
      handler() {
        log.error(
          commandName,
          `The "${commandName}" command was removed by default in v7 with a notice that it was no longer maintained. In v9, over 2 years later, it was finally removed.`
        );
        log.error(
          commandName,
          // TODO: Update the docs to be explicit about the removal in v9
          `Learn more about this change at https://lerna.js.org/docs/legacy-package-management`
        );
        process.exit(1);
      },
    });
  });
}
