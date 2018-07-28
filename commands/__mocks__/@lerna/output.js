"use strict";

const chalk = require("chalk");
const multiLineTrimRight = require("@lerna-test/multi-line-trim-right");

// keep snapshots stable cross-platform
chalk.enabled = false;

// @lerna/output is just a wrapper around console.log
const mockOutput = jest.fn();

function logged() {
  return mockOutput.mock.calls.map(args => multiLineTrimRight(args[0])).join("\n");
}

module.exports = mockOutput;
module.exports.logged = logged;
