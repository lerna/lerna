#!/usr/bin/env node

"use strict"; // eslint-disable-line strict, lines-around-directive

const argv = process.argv.slice(2);
const context = {
  // Avoid UnhandledPromiseRejectionWarning when run() errors in a non-test context
  // (the errors actually _are_ logged, but this avoids yargs re-logging the error)
  _onRejected: err => {
    if (err && err.name !== "ValidationError") {
      console.error(err); // eslint-disable-line no-console
    }
  },
};

require("../lib/cli")().parse(argv, context);
