"use strict";

const dedent = require("dedent");
const isCI = require("is-ci");
const log = require("npmlog");
const yargs = require("yargs/yargs");
const globalOptions = require("@lerna/global-options");

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

  if (isCI || !process.stderr.isTTY) {
    log.disableColor();
    log.disableProgress();
  } else if (!process.stdout.isTTY) {
    // stdout is being piped, don't log non-errors or progress bars
    log.disableProgress();

    cli.check(parsedArgv => {
      // eslint-disable-next-line no-param-reassign
      parsedArgv.loglevel = "error";

      // return truthy or else it blows up
      return parsedArgv;
    });
  } else if (process.stderr.isTTY) {
    log.enableColor();
    log.enableUnicode();
    log.enableProgress();
  }

  return globalOptions(cli)
    .usage("Usage: $0 <command> [options]")
    .commandDir("./commands")
    .demandCommand(1, "A command is required. Pass --help to see all available commands and options.")
    .recommendCommands()
    .strict()
    .fail((msg, err) => {
      // certain yargs validations throw strings :P
      const actual = err || new Error(msg);

      // ValidationErrors are already logged
      if (actual.name !== "ValidationError") {
        // the recommendCommands() message is too terse
        if (/Did you mean/.test(actual.message)) {
          log.error("lerna", `Unknown command "${cli.parsed.argv._[0]}"`);
        }
        log.error("lerna", actual.message);
      }

      // exit non-zero so the CLI can be usefully chained
      process.exitCode = 1;
    })
    .alias("h", "help")
    .alias("v", "version")
    .wrap(cli.terminalWidth()).epilogue(dedent`
      When a command fails, all logs are written to lerna-debug.log in the current working directory.

      For more information, find our manual at https://github.com/lerna/lerna
    `);
}
