#!/usr/bin/env node

var lerna = require("../lib/index");
var chalk = require("chalk");
var meow = require("meow");

var cli = meow([
  "Usage",
  "  $ lerna [command]",
  "",
  "Commands:",
  "  bootstrap  Link together local packages and npm install remaining package dependencies",
  "  publish    Publish updated packages to npm",
  "  updated    Check which packages have changed since the last release",
  "  import     Import a package with git history from an external repository",
  "  clean      Remove the node_modules directory from all packages",
  "  diff       Diff all packages or a single package since the last release",
  "  init       Initialize a lerna repo",
  "  run        Run npm script in each package",
  "  exec       Run a command in each package",
  "  ls         List all public packages",
  "",
  "Options:",
  "  --independent, -i    Version packages independently",
  "  --canary, -c         Publish packages after every successful merge using the sha as part of the tag",
  "  --skip-git           Skip commiting, tagging, and pushing git changes (only affects publish)",
  "  --skip-npm           Stop before actually publishing change to npm (only affects publish)",
  "  --npm-tag [tagname]  Publish packages with the specified npm dist-tag",
  "  --scope [glob]       Restricts the scope to package names matching the given glob (Works only in combination with the 'run' and the 'exec' command).",
  "  --ignore [glob]      Ignores packages with names matching the given glob (Works only in combination with the 'bootstrap' command).",
  "  --force-publish      Force publish for the specified packages (comma-separated) or all packages using * (skips the git diff check for changed packages)",
  "  --yes                Skip all confirmation prompts",
  "  --repo-version       Specify repo version to publish",
  "  --concurrency        How many threads to use if lerna parallelises the tasks (defaults to 4)"
], {
  alias: {
    independent: "i",
    canary: "c",
    forcePublish: "force-version"
  }
});

require("signal-exit").unload();

var commandName = cli.input[0];
var Command = lerna.__commands__[commandName];

if (!Command) {

  // Don't emit "Invalid lerna command: undefined" when run with no command.
  if (commandName) {
    console.log(chalk.red("Invalid lerna command: " + commandName));
  }

  cli.showHelp();
} else {
  var command = new Command(cli.input.slice(1), cli.flags);
  command.run();
}
