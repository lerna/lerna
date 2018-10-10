"use strict";

const log = require("npmlog");
const access = require("libnpmaccess");
const RegistryConfig = require("npm-registry-fetch/config");
const ValidationError = require("@lerna/validation-error");

module.exports = verifyNpmPackageAccess;

function verifyNpmPackageAccess(packages, opts) {
  log.silly("verifyNpmPackageAccess");

  // eslint-disable-next-line no-param-reassign
  opts = RegistryConfig(opts, {
    // don't wait forever for third-party failures to be dealt with
    "fetch-retries": 0,
  });

  return access.lsPackages(opts.username, opts.toJSON()).then(success, failure);

  function success(result) {
    // when _no_ results received, access.lsPackages returns null
    // we can only assume that the packages in question have never been published
    if (result === null) {
      log.warn(
        "",
        "The logged-in user does not have any previously-published packages, skipping permission checks..."
      );
    } else {
      for (const pkg of packages) {
        if (pkg.name in result && result[pkg.name] !== "read-write") {
          throw new ValidationError(
            "EACCESS",
            `You do not have write permission required to publish "${pkg.name}"`
          );
        }
      }
    }
  }

  function failure(err) {
    // pass if registry does not support ls-packages endpoint
    if (err.code === "E500" || err.code === "E404") {
      // most likely a private registry (npm Enterprise, verdaccio, etc)
      log.warn(
        "EREGISTRY",
        "Registry %j does not support `npm access ls-packages`, skipping permission checks...",
        // registry
        opts.registry
      );

      // don't log redundant errors
      return;
    }

    // Log the error cleanly to stderr
    log.pause();
    console.error(err.message); // eslint-disable-line no-console
    log.resume();

    throw new ValidationError("EWHOAMI", "Authentication error. Use `npm whoami` to troubleshoot.");
  }
}
