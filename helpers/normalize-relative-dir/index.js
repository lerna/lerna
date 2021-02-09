"use strict";

const path = require("path");
const normalizePath = require("normalize-path");

module.exports.normalizeRelativeDir = normalizeRelativeDir;

function normalizeRelativeDir(testDir, filePath) {
  return normalizePath(path.relative(testDir, filePath));
}
