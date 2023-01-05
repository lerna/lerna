// @ts-check

"use strict";

const cli = require("@lerna/cli");

const addCmd = require("@lerna/add/command");
const bootstrapCmd = require("@lerna/bootstrap/command");
const changedCmd = require("@lerna/changed/command");
const cleanCmd = require("@lerna/clean/command");
const createCmd = require("@lerna/create/command");
const diffCmd = require("@lerna/diff/command");
const execCmd = require("@lerna/exec/command");
const importCmd = require("@lerna/import/command");
const infoCmd = require("@lerna/info/command");
const initCmd = require("@lerna/init/command");
const linkCmd = require("@lerna/link/command");
const listCmd = require("@lerna/list/command");
const publishCmd = require("@lerna/publish/command");
const runCmd = require("@lerna/run/command");
const versionCmd = require("@lerna/version/command");

const repairCmd = require("./commands/repair/command");
const addCachingCmd = require("./commands/add-caching/command");
const watchCmd = require("./commands/watch/command");

const pkg = require("./package.json");

module.exports = main;

function main(argv) {
  const context = {
    lernaVersion: pkg.version,
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return cli()
    .command(addCmd)
    .command(addCachingCmd)
    .command(bootstrapCmd)
    .command(changedCmd)
    .command(cleanCmd)
    .command(createCmd)
    .command(diffCmd)
    .command(execCmd)
    .command(importCmd)
    .command(infoCmd)
    .command(initCmd)
    .command(linkCmd)
    .command(listCmd)
    .command(publishCmd)
    .command(repairCmd)
    .command(runCmd)
    .command(watchCmd)
    .command(versionCmd)
    .parse(argv, context);
}
