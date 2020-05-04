"use strict";

const multiLineTrimRight = require("@lerna-test/multi-line-trim-right");

// @lerna/output is just a wrapper around console.log
const mockOutput = jest.fn();

function logged() {
  return mockOutput.mock.calls.map((args) => multiLineTrimRight(args[0])).join("\n");
}

module.exports = mockOutput;
module.exports.logged = logged;
