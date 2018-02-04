#!/usr/bin/env node

const importLocal = require("import-local");

if (importLocal(__filename)) {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  require("npmlog").verbose("cli", "using local version of lerna");
} else {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  require("../src/cli")(process.argv.slice(2)).parse();
}
