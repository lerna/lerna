"use strict";

const log = require("npmlog");

module.exports = logPackageError;

function logPackageError(err) {
  log.error(`Error occured in '${err.pkg.name}' while running '${err.cmd}'`);

  const pkgPrefix = `${err.cmd} [${err.pkg.name}]`;
  log.error(pkgPrefix, `Output from stdout:`);
  log.pause();
  console.error(err.stdout); // eslint-disable-line no-console

  log.resume();
  log.error(pkgPrefix, `Output from stderr:`);
  log.pause();
  console.error(err.stderr); // eslint-disable-line no-console

  // Below is just to ensure something sensible is printed after the long stream of logs
  log.resume();
  log.error(`Error occured in '${err.pkg.name}' while running '${err.cmd}'`);
}
