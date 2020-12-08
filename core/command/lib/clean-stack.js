"use strict";

module.exports.cleanStack = cleanStack;

/**
 * @param {import("execa").ExecaError} err
 * @param {string} className
 */
function cleanStack(err, className) {
  const lines = err.stack ? err.stack.split("\n") : String(err).split("\n");
  const cutoff = new RegExp(`^    at ${className}.runCommand .*$`);
  const relevantIndex = lines.findIndex((line) => cutoff.test(line));

  if (relevantIndex) {
    return lines.slice(0, relevantIndex).join("\n");
  }

  // nothing matched, just return original error
  return err;
}
