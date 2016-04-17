#!/usr/bin/env node

var commands = require("../lib/commands");
var logger   = require("../lib/utils/logger");
var meow     = require("meow");
var init     = require("../lib/init");

var cli = meow([
  "Usage",
  "  $ lerna [command]",
  "",
  "Commands:",
  "  bootstrap  Link together local packages and npm install remaining package dependencies",
  "  changelog  Creates a basic changelog categorized by designated github labels",
  "  publish    Publish updated packages to npm",
  "  updated    Check which packages have changed since the last release",
  "  diff       Diff all packages or a single package since the last release",
  "  init       Initialize a lerna repo",
  "  run        Run npm script in each package",
  "  ls         List all public packages",
  "",
  "Options:",
  "  --independent, -i  Version packages independently",
  "  --canary, -c       Publish packages after every successful merge using the sha as part of the tag"
], {
  alias: {
    independent: "i",
    canary: "c"
  }
});

require("signal-exit").unload();

var commandName = cli.input[0];
var command = commands[commandName];

if (!command) {
  logger.log("red", "Invalid command: " + commandName);
  cli.showHelp();
}

var config = init(commandName, cli.input.slice(1), cli.flags);

command(config);
