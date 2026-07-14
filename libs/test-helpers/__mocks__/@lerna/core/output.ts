// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { vi } from "vitest";
import { multiLineTrimRight } from "../../../src/lib/multi-line-trim-right";

const { colorize } = (await vi.importActual("@lerna/core")) as any;
colorize.disable();

// @lerna/output is just a wrapper around console.log
const mockOutput = vi.fn();

function logged() {
  return mockOutput.mock.calls.map((args) => multiLineTrimRight(args[0])).join("\n");
}

export const output = Object.assign(mockOutput, { logged });
