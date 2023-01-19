// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { multiLineTrimRight } from "@lerna/test-helpers";
import chalk from "chalk";

// keep snapshots stable cross-platform
chalk.level = 0;

// @lerna/output is just a wrapper around console.log
const mockOutput = jest.fn();

function logged() {
  return mockOutput.mock.calls.map((args) => multiLineTrimRight(args[0])).join("\n");
}

module.exports.output = mockOutput;
module.exports.output.logged = logged;
