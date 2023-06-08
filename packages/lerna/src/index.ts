/* eslint-disable @typescript-eslint/no-var-requires */
import log from "npmlog";

// Currently external until the usage of LERNA_MODULE_DATA can be refactored
const createCmd = require("@lerna/create/command");

// Bundled
import { lernaCLI } from "@lerna/core";
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

  applyLegacyPackageManagementCommands(cli);

  return cli.parse(argv, context);
};

/**
 * Legacy package management commands not included by default in v7 and will no longer be maintained,
 * but if the user wants to install the final version of them and use them we will respect that by
 * applying them to the CLI.
 *
 * To provide clear feedback to folks trying to run those commands, we add "shell" commands that will
 * explain the situation and exit without doing anything.
 */
function applyLegacyPackageManagementCommands(yargsInstance: ReturnType<typeof lernaCLI>) {
  try {
    const { addCmd, bootstrapCmd, linkCmd } = require("@lerna/legacy-package-management");
    yargsInstance.command(addCmd).command(bootstrapCmd).command(linkCmd);
  } catch {
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
            `The "${commandName}" command was removed by default in v7, and is no longer maintained.`
          );
          log.error(
            commandName,
            `Learn more about this change at https://lerna.js.org/docs/legacy-package-management`
          );
          process.exit(1);
        },
      });
    });
  }
}
