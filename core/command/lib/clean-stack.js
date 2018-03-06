"use strict";

module.exports = cleanStack;

function cleanStack(err, className) {
  const lines = err.stack ? err.stack.split("\n") : err.split("\n");
  const cutoff = new RegExp(`^    at ${className}.runCommand .*$`);
  const relevantIndex = lines.findIndex(line => cutoff.test(line));

  return lines.slice(0, relevantIndex).join("\n");
}
