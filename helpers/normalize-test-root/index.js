"use strict";

const normalizeNewline = require("normalize-newline");
const normalizePath = require("normalize-path");
const path = require("path");

module.exports = normalizeTestRoot;

// tempy creates subdirectories with hexadecimal names that are 32 characters long
const TEMP_DIR_REGEXP = /([^\s"]*[\\/][0-9a-f]{32})([^\s"]*)/g;
// the excluded quotes are due to other snapshot serializers mutating the raw input

function normalizeTestRoot(str) {
  const ret = normalizeNewline(str).replace(TEMP_DIR_REGEXP, serializeTestRoot);

  // desperately trying to avoid "Compared values have no visual difference" garbage in Windows CI
  return JSON.parse(JSON.stringify(ret));
}

function serializeTestRoot(match, cwd, subPath) {
  return normalizePath(path.join("__TEST_ROOTDIR__", subPath));
}
