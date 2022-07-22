"use strict";

const dedent = require("dedent");
const log = require("npmlog");
const yargs = require("yargs/yargs");
const { globalOptions } = require("@lerna/global-options");

module.exports = lernaCLI;

/**
 * A factory that returns a yargs() instance configured with everything except commands.
 * Chain .parse() from this method to invoke.
 *
 * @param {Array = []} argv
 * @param {String = process.cwd()} cwd
 */
function lernaCLI(argv, cwd) {
  const cli = yargs(argv, cwd);

  return globalOptions(cli)
    .usage("Usage: $0 <command> [options]")
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
      cli.exit(actual.exitCode > 0 ? actual.exitCode : 1, actual);
    })
    .alias("h", "help")
    .alias("v", "version")
    .wrap(cli.terminalWidth()).epilogue(dedent`
      When a command fails, all logs are written to lerna-debug.log in the current working directory.

      For more information, check out the docs at https://lerna.js.org/docs/introduction
    `);
}
