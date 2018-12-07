#!/usr/bin/env node

"use strict";

/* eslint-disable import/no-dynamic-require, global-require */
const importLocal = require("import-local");

if (importLocal(__filename)) {
  require("libnpm/log").info("cli", "using local version of lerna");
} else {
  require(".")(process.argv.slice(2));
}
