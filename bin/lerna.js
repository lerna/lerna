#!/usr/bin/env node

var lerna = require("../lib/index");
var logger = require("../lib/logger");
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
  "  --independent, -i       Version packages independently",
  "  --canary, -c            Publish packages after every successful merge using the sha as part of the tag",
  "  --git-remote [remote]   Push git changes to the specified remote instead of 'origin'",
  "  --skip-git              Skip commiting, tagging, and pushing git changes (only affects publish)",
  "  --skip-npm              Stop before actually publishing change to npm (only affects publish)",
  "  --message, -m [msg]  Use a custom commit message when creating the publish commit (only affects publish)",
  "  --exact                 Specify cross-dependency version numbers exactly rather than with a caret (^) (only affects publish)",
  "  --npm-tag [tagname]     Publish packages with the specified npm dist-tag",
  "  --npm-client [client]   Executable used to install dependencies (npm, yarn, pnpm, ...)",
  "  --hoist [glob]          Install external dependencies matching [glob] to the repo root.  Use with no glob for all.",
  "  --nohoist [glob]        Don't hoist external dependencies matching [glob] to the repo root",
  "  --stream                Stream output with lines prefixed by package (only 'run')",
  "  --scope [glob]          Restricts the scope to package names matching the given glob (Works only in combination with the 'run', 'exec', 'clean', 'ls' and 'bootstrap' commands).",
  "  --ignore [glob]         Ignores packages with names matching the given glob (Works only in combination with the 'run', 'exec', 'clean', 'ls' and 'bootstrap' commands).",
  "  --include-filtered-dependencies Flag to force lerna to include all dependencies and transitive dependencies when running 'bootstrap', even if they should not be included by the scope or ignore flags",
  "  --force-publish         Force publish for the specified packages (comma-separated) or all packages using * (skips the git diff check for changed packages)",
  "  --yes                   Skip all confirmation prompts",
  "  --repo-version          Specify repo version to publish",
  "  --concurrency           How many threads to use if lerna parallelises the tasks (defaults to 4)",
  "  --loglevel              What level of logs to report (defaults to \"info\").  On failure, all logs are written to lerna-debug.log in the current working directory.",
  "  --no-sort            When executing tasks, ignore the dependency ordering of packages (only affects run, exec, publish and bootstrap)",
], {
  alias: {
    independent: "i",
    canary: "c",
    message: "m",
    forcePublish: "force-version"
  }
});

require("signal-exit").unload();

logger.setLogLevel(cli.flags.loglevel);

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
