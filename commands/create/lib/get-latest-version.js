"use strict";

const ChildProcessUtilities = require("@lerna/child-process");

module.exports = getLatestVersion;

// istanbul ignore next
function getLatestVersion(depName, execOpts) {
  // TODO: use pacote.manifest() instead
  return ChildProcessUtilities.execSync("npm", ["info", depName, "version"], execOpts);
}
