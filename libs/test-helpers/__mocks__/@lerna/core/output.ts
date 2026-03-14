// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

const { colorize } = jest.requireActual("@lerna/core") as any;
colorize.disable();

import { multiLineTrimRight } from "../../../src/lib/multi-line-trim-right";

// @lerna/output is just a wrapper around console.log
const mockOutput = jest.fn();

function logged() {
  return mockOutput.mock.calls.map((args) => multiLineTrimRight(args[0])).join("\n");
}

module.exports.output = mockOutput;
module.exports.output.logged = logged;
