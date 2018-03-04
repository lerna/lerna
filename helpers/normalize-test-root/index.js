"use strict";

const normalizePath = require("normalize-path");
const path = require("path");

module.exports = normalizeTestRoot;

function normalizeTestRoot(cwd) {
  // lol windows paths often look like escaped slashes, so re-re-escape them :P
  const dirPath = new RegExp(`(${cwd.replace(/\\/g, "\\\\")})([\\S]*)`, "g");

  return str => str.replace(dirPath, serializeTestRoot);
}

function serializeTestRoot(match, cwd, subPath) {
  return normalizePath(path.join("__TEST_ROOTDIR__", subPath));
}
