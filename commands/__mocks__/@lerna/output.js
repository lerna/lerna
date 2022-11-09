"use strict";

const chalk = require("chalk");
const { multiLineTrimRight } = require("@lerna-test/helpers");

// keep snapshots stable cross-platform
chalk.level = 0;

// @lerna/output is just a wrapper around console.log
const mockOutput = jest.fn();

function logged() {
  return mockOutput.mock.calls.map((args) => multiLineTrimRight(args[0])).join("\n");
}

module.exports.output = mockOutput;
module.exports.output.logged = logged;
