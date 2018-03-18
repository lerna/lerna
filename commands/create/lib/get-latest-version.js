"use strict";

const ChildProcessUtilities = require("@lerna/child-process");

module.exports = getLatestVersion;

function getLatestVersion(depName, execOpts) {
  return ChildProcessUtilities.execSync("npm", ["info", depName, "version"], execOpts);
}
