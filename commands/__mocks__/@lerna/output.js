"use strict";

const chalk = require("chalk");
const normalizeNewline = require("normalize-newline");

// keep snapshots stable cross-platform
chalk.enabled = false;

// @lerna/output is just a wrapper around console.log
const mockOutput = jest.fn();

function logged() {
  return mockOutput.mock.calls
    .map(args =>
      normalizeNewline(args[0])
        .split("\n")
        .map(line => line.trimRight())
        .join("\n")
    )
    .join("\n");
}

module.exports = mockOutput;
module.exports.logged = logged;
