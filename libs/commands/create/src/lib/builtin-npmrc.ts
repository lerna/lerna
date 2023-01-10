import fs from "fs-extra";
import path from "path";

module.exports.builtinNpmrc = builtinNpmrc;

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
