"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const normalizePath = require("normalize-path");

// tempy creates subdirectories with hexadecimal names
const TEMP_DIR = path.join(fs.realpathSync(os.tmpdir()), "[0-9a-f]+");

// lol windows paths often look like escaped slashes, so re-re-escape them :P
const ROOT_DIR = new RegExp(`(${TEMP_DIR.replace(/\\/g, "\\\\")})([\\S]*)`, "g");

// expect.addSnapshotSerializer(require("@lerna-test/serialize-tempdir"));
module.exports = {
  test(val) {
    return typeof val === "string" && ROOT_DIR.test(val);
  },
  serialize(val, config, indentation, depth) {
    const str = val.replace(ROOT_DIR, serializeProjectRoot);

    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${str}"` : str;
  },
};

function serializeProjectRoot(match, cwd, subPath) {
  return normalizePath(path.join("<PROJECT_ROOT>", subPath));
}
