"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const normalizePath = require("normalize-path");

const TEMP_DIR = fs.realpathSync(os.tmpdir());
const ROOT_DIR = new RegExp(path.join(TEMP_DIR, "[0-9a-f]+"), "g");

// expect.addSnapshotSerializer(require("@lerna-test/serialize-tempdir"));
module.exports = {
  test(val) {
    return typeof val === "string" && ROOT_DIR.test(val);
  },
  serialize(val, config, indentation, depth) {
    const str = normalizePath(val.replace(ROOT_DIR, "<PROJECT_ROOT>"));

    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${str}"` : str;
  },
};
