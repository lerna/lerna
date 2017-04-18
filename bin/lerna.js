#!/usr/bin/env node
"use strict";

const yargs = require("yargs");
const dedent = require("dedent");
const globalOptions = require("../lib/Command").builder;

// the options grouped under "Global Options:" header
const globalKeys = Object.keys(globalOptions).concat([
  "help",
  "version",
]);

yargs
  .epilogue(dedent`
    When a command fails, all logs are written to lerna-debug.log in the current working directory.

    For more information, find our manual at https://github.com/lerna/lerna
  `)
  .usage("Usage: $0 <command> [options]")
  .wrap(yargs.terminalWidth())
  .options(globalOptions).group(globalKeys, "Global Options:")
  .commandDir("../lib/commands")
  .demandCommand()
  .help("h").alias("h", "help")
  .version().alias("v", "version")
  .argv;
