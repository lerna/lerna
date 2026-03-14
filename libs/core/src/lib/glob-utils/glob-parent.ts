/**
 * Extract the non-glob parent path from a glob string.
 *
 * Modernized TypeScript replacement for the `glob-parent` npm package.
 */
import os from "os";
import path from "path";

import { isGlob } from "./is-glob";

const slash = "/";
const backslash = /\\/g;
const enclosure = /[{[].*[}\]]$/;
const globby = /(^|[^\\])([{[]|\([^)]+$)/;
const escaped = /\\([!*?|[\](){}])/g;

export function globParent(str: string): string {
  const isWin32 = os.platform() === "win32";

  if (isWin32 && !str.includes(slash)) {
    str = str.replace(backslash, slash);
  }

  if (enclosure.test(str)) {
    str += slash;
  }

  str += "a";

  do {
    str = path.posix.dirname(str);
  } while (isGlob(str) || globby.test(str));

  return str.replace(escaped, "$1");
}
