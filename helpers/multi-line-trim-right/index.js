"use strict";

const normalizeNewline = require("normalize-newline");

module.exports = multiLineTrimRight;

// const multiLineTrimRight = require("@lerna-test/multi-line-trim-right");
function multiLineTrimRight(str) {
  return normalizeNewline(str)
    .split("\n")
    .map(line => line.trimRight())
    .join("\n");
}
