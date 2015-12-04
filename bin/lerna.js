#!/usr/bin/env node

var args = process.argv.slice(2);
if (args.length > 1) {
  console.error("Too many arguments.");
  process.exit(1);
}

var arg = args[0];

if (arg === "-v" || arg === "-V" || arg === "--version" || arg === "-version") {
  console.log(require("../package.json").version);
  process.exit(0);
}

var commands = require("../lib/commands");
var init     = require("../lib/init");

if (!arg || arg === "--help" || arg === "-h" || arg === "-H" || arg === "-help") {
  console.log();
  console.log("  lerna [command]");
  console.log();
  console.log("  Commands:");
  console.log();

  for (var key in commands) {
    var desc = commands[key].description;
    console.log("    " + key + " - " + desc);
  }

  console.log();
  process.exit(0);
}

if (!(arg in commands)) {
  console.error("Unknown command " + JSON.stringify(arg));
  process.exit(1);
}

var command = commands[arg];
command.execute(init(arg, process.cwd()));
