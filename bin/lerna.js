#!/usr/bin/env node
"use strict";

const globalOptions = require("../lib/Command").builder;
const logger = require("../lib/logger");
const yargs = require("yargs");
const path = require("path");

logger.setLogLevel(yargs.argv.loglevel);

yargs
  .epilogue("For more information, find our manual at https://github.com/lerna/lerna")
  .usage("$ lerna [command] [flags]")
  .wrap(yargs.terminalWidth())
  .option("loglevel", {
    default: "info",
    describe: "What level of logs to report. On failure, all logs are written to lerna-debug.log in the current working directory.",
    type: "string",
    global: true
  })
  .options(globalOptions).group(Object.keys(globalOptions), "Global Options:")
  .commandDir(path.join(__dirname, "..", "lib", "commands"))
  .demandCommand()
  .help()
  .argv;

require("signal-exit").unload();
