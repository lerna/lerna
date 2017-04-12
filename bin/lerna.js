#!/usr/bin/env node
"use strict";

const globalOptions = require("../lib/Command").builder;
const logger = require("../lib/logger");
const yargs = require("yargs");
const path = require("path");

logger.setLogLevel(yargs.argv.loglevel);

// workaround non-interactive yargs.terminalWidth() error
// until https://github.com/yargs/yargs/pull/837 is released
function terminalWidth() {
  return typeof process.stdout.columns !== "undefined" ? process.stdout.columns : null;
}

yargs
  .epilogue("For more information, find our manual at https://github.com/lerna/lerna")
  .usage("$ lerna [command] [flags]")
  .wrap(terminalWidth())
  .option("loglevel", {
    default: "info",
    describe: "What level of logs to report. On failure, all logs are written to lerna-debug.log in the"
            + "current working directory.",
    type: "string",
    global: true
  })
  .options(globalOptions).group(Object.keys(globalOptions), "Global Options:")
  .commandDir(path.join(__dirname, "..", "lib", "commands"))
  .demandCommand()
  .help()
  .argv;

require("signal-exit").unload();
