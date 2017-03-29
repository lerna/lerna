#!/usr/bin/env node
"use strict";

/* eslint-disable max-len */
// too many long lines in this file to bother

const lerna = require("../lib/index");
const logger = require("../lib/logger");
const chalk = require("chalk");
const yargs = require("yargs");
const _ = require("lodash");

yargs.epilogue("For more information, find our manual at https://github.com/lerna/lerna");
yargs.usage("$ lerna [command]");
yargs.wrap(yargs.terminalWidth());
yargs
  .option("loglevel", {
    default: "info",
    describe: "What level of logs to report. On failure, all logs are written to lerna-debug.log in the current working directory.",
    type: "string",
    global: true
  });

require("signal-exit").unload();

logger.setLogLevel(yargs.argv.loglevel || "info");

const commandName = yargs.argv._[0];
const Command = lerna.__commands__[commandName];

Object.keys(lerna.__commands__)
  .forEach((commandName) => {
    const cmd = lerna.__commands__[commandName];
    const opts = cmd.getSupportedOptions();
    yargs.command(commandName, cmd.describe, (yargs) => {
      Object.keys(opts)
        .forEach((optionName) => {
          let kebabName = _.kebabCase(optionName);
          yargs.option(kebabName, opts[optionName]);
        });
      return yargs;
    });
  });

if (!Command) {

  // Don't emit "Invalid lerna command: undefined" when run with no command.
  if (commandName) {
    console.log(chalk.red("Invalid lerna command: " + commandName));
  }

  yargs.showHelp();
} else if (yargs.argv.help) {
  yargs.showHelp();
} else {
  // camelCased properties will only be set when the user passed the flags in the CLI
  // yargs seemingly does not provide a clean API which only returns flags given, so we should filter the flags for readability
  const argsFiltered = _.omitBy(yargs.argv, (value, key) => {
    return value === undefined || ["$0", "_"].indexOf(key) > -1 || key.indexOf("-") > -1;
  });
  const command = new Command(yargs.argv._.slice(1), argsFiltered);
  command.run();
}
