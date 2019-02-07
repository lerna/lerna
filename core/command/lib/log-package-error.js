"use strict";

const log = require("npmlog");

module.exports = logPackageError;

function logPackageError(err, stream = false) {
  log.error(err.cmd, `exited ${err.code} in '${err.pkg.name}'`);

  if (stream) {
    // Streaming has already printed all stdout/stderr
    return;
  }

  if (err.stdout) {
    log.error(err.cmd, "stdout:");
    directLog(err.stdout);
  }

  if (err.stderr) {
    log.error(err.cmd, "stderr:");
    directLog(err.stderr);
  }

  // Below is just to ensure something sensible is printed after the long stream of logs
  log.error(err.cmd, `exited ${err.code} in '${err.pkg.name}'`);
}

function directLog(message) {
  log.pause();
  console.error(message); // eslint-disable-line no-console
  log.resume();
}
