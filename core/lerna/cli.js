#!/usr/bin/env node

"use strict";

/* eslint-disable import/no-dynamic-require, global-require */
const importLocal = require("import-local");

if (importLocal(__filename)) {
  require("npmlog").info("cli", "using local version of lerna");
} else {
  const pkg = require("./package.json");

  require("@lerna/cli")().parse(process.argv.slice(2), { lernaVersion: pkg.version });
}
