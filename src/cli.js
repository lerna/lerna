import yargs from "yargs/yargs";
import dedent from "dedent";
import { builder as globalOptions } from "./Command";

/**
Essentially a factory that returns a yargs() instance that can
be used to call parse() immediately (as in ../bin/lerna) or by
unit tests to encapsulate instantiation with "real" arguments.

@param {Array = []} argv
@param {String = process.cwd()} cwd
**/
export default function CLI(argv, cwd) {
  const cli = yargs(argv, cwd);

  // the options grouped under "Global Options:" header
  const globalKeys = Object.keys(globalOptions).concat([
    "help",
    "version",
  ]);

  return cli
    .usage("Usage: $0 <command> [options]")
    .options(globalOptions).group(globalKeys, "Global Options:")
    .commandDir("../lib/commands")
    .demandCommand()
    .help("h").alias("h", "help")
    .version().alias("v", "version")
    .wrap(cli.terminalWidth())
    .epilogue(dedent`
      When a command fails, all logs are written to lerna-debug.log in the current working directory.

      For more information, find our manual at https://github.com/lerna/lerna
    `);
}
