import dedent from "dedent";
import isCI from "is-ci";
import log from "npmlog";
import yargs from "yargs/yargs";

import { builder as globalOptions } from "./Command";

/**
 * Essentially a factory that returns a yargs() instance that can
 * be used to call parse() immediately (as in ../bin/lerna) or by
 * unit tests to encapsulate instantiation with "real" arguments.
 *
 * @param {Array = []} argv
 * @param {String = process.cwd()} cwd
 */
export default function CLI(argv, cwd) {
  const cli = yargs(argv, cwd);

  // the options grouped under "Global Options:" header
  const globalKeys = Object.keys(globalOptions).concat(["help", "version"]);

  if (isCI || !process.stderr.isTTY) {
    log.disableColor();
    log.disableProgress();
  } else if (process.stderr.isTTY) {
    log.enableColor();
    log.enableUnicode();
    log.enableProgress();
  }

  return cli
    .usage("Usage: $0 <command> [options]")
    .options(globalOptions)
    .group(globalKeys, "Global Options:")
    .commandDir("../lib/commands")
    .command("*", "", {}, parsed => {
      // a default command with no description catches typos or missing subcommands
      log.error("lerna", `${parsed._.length ? "Invalid" : "Missing"} command!`);
      log.error("lerna", "Pass --help to see all available commands and options.");

      // exit non-zero instead of throw an error so the CLI can be usefully chained
      process.exitCode = 1;
    })
    .demandCommand(1, "Pass --help to see all available commands and options.")
    .showHelpOnFail(false, "A command is required.")
    .help("h")
    .alias("h", "help")
    .version()
    .alias("v", "version")
    .wrap(cli.terminalWidth()).epilogue(dedent`
      When a command fails, all logs are written to lerna-debug.log in the current working directory.

      For more information, find our manual at https://github.com/lerna/lerna
    `);
}
