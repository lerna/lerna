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
const initCmd = require("@lerna/init/command");
const linkCmd = require("@lerna/link/command");
const publishCmd = require("@lerna/publish/command");
const runCmd = require("@lerna/run/command");
const versionCmd = require("@lerna/version/command");

import * as repairCmd from "./commands/repair/command";
import * as addCachingCmd from "./commands/add-caching/command";
import * as watchCmd from "./commands/watch/command";
import * as infoCmd from "@lerna/commands/info/command";
import * as listCmd from "@lerna/commands/list/command";

const pkg = require("../package.json");

module.exports = function main(argv: NodeJS.Process["argv"]) {
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
    .command(watchCmd)
    .command(versionCmd)
    .parse(argv, context);
};
