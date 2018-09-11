"use strict";

const path = require("path");
const normalizePath = require("normalize-path");

// tempy creates subdirectories with hexadecimal names that are 32 characters long
const TEMP_DIR_REGEXP = /([^\s"]*[\\/][0-9a-f]{32})([^\s"]*)/g;
// the excluded quotes are due to other snapshot serializers mutating the raw input

// expect.addSnapshotSerializer(require("@lerna-test/serialize-tempdir"));
module.exports = {
  test(val) {
    return typeof val === "string" && TEMP_DIR_REGEXP.test(val);
  },
  serialize(val, config, indentation, depth) {
    const str = val.replace(TEMP_DIR_REGEXP, serializeProjectRoot);

    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${str}"` : str;
  },
};

function serializeProjectRoot(match, cwd, subPath) {
  return normalizePath(path.join("__TEST_ROOTDIR__", subPath));
}
