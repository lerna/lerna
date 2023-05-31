#!/usr/bin/env node

/* eslint-disable */

"use strict";

const importLocal = require("import-local");

if (importLocal(__filename)) {
  require("npmlog").info("cli", "using local version of lerna");
} else {
  require(".")(process.argv.slice(2));
}
