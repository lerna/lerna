"use strict";

const log = require("npmlog");
const path = require("path");
const pathExists = require("path-exists");

const ChildProcessUtilities = require("@lerna/child-process");

// NOTE: if rimraf moves the location of its executable, this will need to be updated
const RIMRAF_CLI = require.resolve("rimraf/bin");

module.exports = rimrafDir;

function rimrafDir(dirPath) {
  log.silly("rimrafDir", dirPath);
  // Shelling out to a child process for a noop is expensive.
  // Checking if `dirPath` exists to be removed is cheap.
  // This lets us short-circuit if we don't have anything to do.

  return pathExists(dirPath).then(exists => {
    if (!exists) {
      return;
    }

    // globs only return directories with a trailing slash
    const slashed = path.normalize(`${dirPath}/`);
    const args = [RIMRAF_CLI, "--no-glob", slashed];

    // We call this resolved CLI path in the "path/to/node path/to/cli <..args>"
    // pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
    return ChildProcessUtilities.spawn(process.execPath, args).then(() => {
      log.verbose("rimrafDir", "removed", dirPath);

      return dirPath;
    });
  });
}
