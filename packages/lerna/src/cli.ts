#!/usr/bin/env node

import importLocal from "import-local";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

if (importLocal(import.meta.filename)) {
  minimalInfoLog("cli", "using local version of lerna");
} else {
  const main: typeof import("./index").default = require("./index.js");
  main(process.argv.slice(2));
}

// Minimal standalone log function to avoid needing to import full Logger
function minimalInfoLog(prefix: string, message: string) {
  const stream = process.stderr;
  const green = "\x1b[32m";
  const magenta = "\x1b[35m";
  const reset = "\x1b[0m";
  const useColor = stream.isTTY;

  let output = "";

  if (useColor) {
    output += green;
  }
  output += "info";
  if (useColor) {
    output += reset;
  }

  if (prefix) {
    output += " ";
    if (useColor) {
      output += magenta;
    }
    output += prefix;
    if (useColor) {
      output += reset;
    }
  }

  output += ` ${message}`;

  stream.write(`${output}\n`);
}
