"use strict";

jest.mock("@lerna/output");

const chalk = require("chalk");
const normalizeNewline = require("normalize-newline");
const output = require("@lerna/output");

// keep snapshots stable cross-platform
chalk.enabled = false;

module.exports = consoleOutput;

function consoleOutput() {
  return output.mock.calls
    .map(args =>
      normalizeNewline(args[0])
        .split("\n")
        .map(line => line.trimRight())
        .join("\n")
    )
    .join("\n");
}
