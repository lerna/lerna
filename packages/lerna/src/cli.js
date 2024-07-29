#!/usr/bin/env node

// @ts-check

/* eslint-disable */

"use strict";

const importLocal = require("import-local");

if (importLocal(__filename)) {
  // Minimal standalone log function to avoid needing to import full Logger
  function minimalInfoLog(prefix, message) {
    const stream = process.stderr;
    const green = "\x1b[32m";
    const magenta = "\x1b[35m";
    const reset = "\x1b[0m";
    const useColor = stream.isTTY;

    let output = "";

    if (useColor) {
      output += green; // Info level color
    }
    output += "info";
    if (useColor) {
      output += reset;
    }

    if (prefix) {
      output += " ";
      if (useColor) {
        output += magenta; // Prefix color
      }
      output += prefix;
      if (useColor) {
        output += reset;
      }
    }

    output += " " + message;

    stream.write(output + "\n");
  }

  minimalInfoLog("cli", "using local version of lerna");
} else {
  // @ts-ignore
  require(".")(process.argv.slice(2));
}
