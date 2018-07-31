"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const normalizePath = require("normalize-path");

// temp directories are often symlinks (e.g., MacOS)
const TMPDIR_REALPATH = fs.realpathSync(os.tmpdir());

// tempy creates subdirectories with hexadecimal names that are 32 characters long
const SUBTEMP_PATTERN = path.join(TMPDIR_REALPATH, "[0-9a-f]{32}");

// lol windows paths often look like escaped slashes, so re-re-escape them :P
const ESCAPED_PATTERN = `(${SUBTEMP_PATTERN.replace(/\\/g, "\\\\")})([\\S]*)`;

// finally create the dang regular expression
const ROOT_DIR_REGEXP = new RegExp(ESCAPED_PATTERN, "g");

console.error("TMPDIR_REALPATH %j", TMPDIR_REALPATH);
console.error("SUBTEMP_PATTERN %j", SUBTEMP_PATTERN);
console.error("ESCAPED_PATTERN %j", ESCAPED_PATTERN);
console.error("ROOT_DIR_REGEXP %s", ROOT_DIR_REGEXP);

// expect.addSnapshotSerializer(require("@lerna-test/serialize-tempdir"));
module.exports = {
  test(val) {
    return typeof val === "string" && val.indexOf(TMPDIR_REALPATH) > -1;
  },
  serialize(val, config, indentation, depth) {
    const str = val.replace(ROOT_DIR_REGEXP, serializeProjectRoot);

    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${str}"` : str;
  },
};

function serializeProjectRoot(match, cwd, subPath) {
  return normalizePath(path.join("<PROJECT_ROOT>", subPath));
}
