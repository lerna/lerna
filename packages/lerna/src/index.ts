/* eslint-disable @typescript-eslint/no-var-requires */
"use strict";

import { lernaCLI } from "@lerna/core";

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

const repairCmd = require("./commands/repair");
const addCachingCmd = require("./commands/add-caching");

module.exports = main;

function main(argv: NodeJS.Process["argv"]) {
  const pkg = require("../package.json");

  const context = {
    lernaVersion: pkg.version,
  };

  return lernaCLI()
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
    .command(versionCmd)
    .parse(argv, context);
}
