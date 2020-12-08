"use strict";

const log = require("npmlog");

module.exports.logPackageError = logPackageError;

/**
 * @param {import("execa").ExecaError & { pkg: import("@lerna/package").Package }} err
 * @param {boolean} stream
 */
function logPackageError(err, stream = false) {
  log.error(err.command, `exited ${err.exitCode} in '${err.pkg.name}'`);

  if (stream) {
    // Streaming has already printed all stdout/stderr
    return;
  }

  if (err.stdout) {
    log.error(err.command, "stdout:");
    directLog(err.stdout);
  }

  if (err.stderr) {
    log.error(err.command, "stderr:");
    directLog(err.stderr);
  }

  // Below is just to ensure something sensible is printed after the long stream of logs
  log.error(err.command, `exited ${err.exitCode} in '${err.pkg.name}'`);
}

/** @param {string} message */
function directLog(message) {
  log.pause();
  console.error(message); // eslint-disable-line no-console
  log.resume();
}
