"use strict";

const dedent = require("dedent");
const isCI = require("is-ci");
const log = require("npmlog");
const yargs = require("yargs/yargs");
const globalOptions = require("./Command").builder;

module.exports = CLI;

/**
 * Essentially a factory that returns a yargs() instance that can
 * be used to call parse() immediately (as in ../bin/lerna) or by
 * unit tests to encapsulate instantiation with "real" arguments.
 *
 * @param {Array = []} argv
 * @param {String = process.cwd()} cwd
 */
function CLI(argv, cwd) {
  const cli = yargs(argv, cwd);

  // the options grouped under "Global Options:" header
  const globalKeys = Object.keys(globalOptions).concat(["help", "version"]);

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

  return cli
    .usage("Usage: $0 <command> [options]")
    .options(globalOptions)
    .group(globalKeys, "Global Options:")
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
