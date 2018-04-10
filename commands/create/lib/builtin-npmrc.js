"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports = builtinNpmrc;

function builtinNpmrc() {
  let resolvedPath = "";

  try {
    // e.g., /usr/local/lib/node_modules/npm/npmrc
    resolvedPath = path.resolve(
      fs.realpathSync(path.join(path.dirname(process.execPath), "npm")),
      "../../npmrc"
    );
  } catch (err) {
    // ignore
  }

  return resolvedPath;
}
