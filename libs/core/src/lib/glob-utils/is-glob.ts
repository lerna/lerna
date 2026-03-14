/**
 * Determine whether a string is a glob pattern.
 * Implements strict-mode checking only (no relaxed/non-strict mode).
 *
 * Modernized TypeScript replacement for the `is-glob` npm package.
 */
import { isExtglob } from "./is-extglob";

const strictRegex = /\\(.)|(^!|[*?]|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\))/;

export function isGlob(str: string): boolean {
  if (str === "") return false;
  if (isExtglob(str)) return true;
  const match = strictRegex.exec(str);
  if (match) {
    return !match[1];
  }
  return false;
}
