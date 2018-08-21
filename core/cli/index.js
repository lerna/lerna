"use strict";

const dedent = require("dedent");
const log = require("npmlog");
const yargs = require("yargs/yargs");
const globalOptions = require("@lerna/global-options");

const addCmd = require("@lerna/add/command");
const bootstrapCmd = require("@lerna/bootstrap/command");
const changedCmd = require("@lerna/changed/command");
const cleanCmd = require("@lerna/clean/command");
const createCmd = require("@lerna/create/command");
const diffCmd = require("@lerna/diff/command");
const execCmd = require("@lerna/exec/command");
const importCmd = require("@lerna/import/command");
const initCmd = require("@lerna/init/command");
const linkCmd = require("@lerna/link/command");
const listCmd = require("@lerna/list/command");
const publishCmd = require("@lerna/publish/command");
const runCmd = require("@lerna/run/command");
const versionCmd = require("@lerna/version/command");

module.exports = lernaCLI;

/**
 * Essentially a factory that returns a yargs() instance that can
 * be used to call parse() immediately (as in ../lerna) or by
 * unit tests to encapsulate instantiation with "real" arguments.
 *
 * @param {Array = []} argv
 * @param {String = process.cwd()} cwd
 */
function lernaCLI(argv, cwd) {
  const cli = yargs(argv, cwd);

  return globalOptions(cli)
    .usage("Usage: $0 <command> [options]")
    .command(addCmd)
    .command(bootstrapCmd)
    .command(changedCmd)
    .command(cleanCmd)
    .command(createCmd)
    .command(diffCmd)
    .command(execCmd)
    .command(importCmd)
    .command(initCmd)
    .command(linkCmd)
    .command(listCmd)
    .command(publishCmd)
    .command(runCmd)
    .command(versionCmd)
    .demandCommand(1, "A command is required. Pass --help to see all available commands and options.")
    .recommendCommands()
    .strict()
    .fail((msg, err) => {
      // certain yargs validations throw strings :P
      const actual = err || new Error(msg);

      // ValidationErrors are already logged, as are package errors
      if (actual.name !== "ValidationError" && !actual.pkg) {
        // the recommendCommands() message is too terse
        if (/Did you mean/.test(actual.message)) {
          log.error("lerna", `Unknown command "${cli.parsed.argv._[0]}"`);
        }

        log.error("lerna", actual.message);
      }

      // exit non-zero so the CLI can be usefully chained
      cli.exit(actual.code || 1, actual);
    })
    .alias("h", "help")
    .alias("v", "version")
    .wrap(cli.terminalWidth()).epilogue(dedent`
      When a command fails, all logs are written to lerna-debug.log in the current working directory.

      For more information, find our manual at https://github.com/lerna/lerna
    `);
}
