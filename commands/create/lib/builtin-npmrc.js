"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports = builtinNpmrc;

function builtinNpmrc() {
  const globalNpmBin = path.resolve(path.dirname(process.execPath), "npm");

  // e.g., /usr/local/lib/node_modules/npm/npmrc
  return path.resolve(fs.realpathSync(globalNpmBin), "../../npmrc");
}
