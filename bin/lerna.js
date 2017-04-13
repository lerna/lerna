#!/usr/bin/env node
"use strict";

const globalOptions = require("../lib/Command").builder;
const logger = require("../lib/logger");
const yargs = require("yargs");
const path = require("path");

// the options grouped under "Global Options:" header
const globalKeys = Object.keys(globalOptions).concat([
  "loglevel",
  "help",
  "version",
]);

// workaround non-interactive yargs.terminalWidth() error
// until https://github.com/yargs/yargs/pull/837 is released
function terminalWidth() {
  return typeof process.stdout.columns !== "undefined" ? process.stdout.columns : null;
}

logger.setLogLevel(yargs.argv.loglevel);

yargs
  .epilogue("For more information, find our manual at https://github.com/lerna/lerna")
  .usage("Usage: $0 <command> [options]")
  .wrap(terminalWidth())
  .option("loglevel", {
    default: "info",
    describe: "What level of logs to report. On failure, all logs are written to lerna-debug.log in the"
            + "current working directory.",
    type: "string",
    global: true
  })
  .options(globalOptions).group(globalKeys, "Global Options:")
  .commandDir(path.join(__dirname, "..", "lib", "commands"))
  .demandCommand()
  .help("h").alias("h", "help")
  .version().alias("v", "version")
  .argv;
