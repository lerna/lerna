#!/usr/bin/env node
"use strict";
const importLocal = require("import-local");

if (importLocal(__filename)) {
  require("npmlog").verbose("cli", "using local version of lerna");
} else {
  require("../lib/cli")().parse(process.argv.slice(2));
}

