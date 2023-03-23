/* eslint-disable @typescript-eslint/no-var-requires */
"use strict";

// Legacy package management commands included by default until v7
const { addCmd, bootstrapCmd, linkCmd } = require("@lerna/legacy-package-management");

// Currently external until the usage of LERNA_MODULE_DATA can be refactored
const createCmd = require("@lerna/create/command");

// Bundled
import { lernaCLI } from "@lerna/core";
import * as changedCmd from "@lerna/commands/changed/command";
import * as cleanCmd from "@lerna/commands/clean/command";
import * as diffCmd from "@lerna/commands/diff/command";
import * as execCmd from "@lerna/commands/exec/command";
import * as importCmd from "@lerna/commands/import/command";
import * as infoCmd from "@lerna/commands/info/command";
import * as initCmd from "@lerna/commands/init/command";
import * as listCmd from "@lerna/commands/list/command";
import * as publishCmd from "@lerna/commands/publish/command";
import * as runCmd from "@lerna/commands/run/command";
import * as versionCmd from "@lerna/commands/version/command";

import * as addCachingCmd from "./commands/add-caching/command";
import * as repairCmd from "./commands/repair/command";
import * as watchCmd from "./commands/watch/command";

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
