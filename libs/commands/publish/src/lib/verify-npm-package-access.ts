import { pulseTillDone, ValidationError } from "@lerna/core";
import access from "libnpmaccess";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getFetchConfig } = require("./fetch-config");

module.exports.verifyNpmPackageAccess = verifyNpmPackageAccess;

/**
 * Throw an error if the logged-in user does not have read-write access to all packages.
 * @param {{ name: string; }[]} packages
 * @param {string} username
 * @param {import("./fetch-config").FetchConfig} options
 * @returns {Promise<void>}
 */
function verifyNpmPackageAccess(packages, username, options) {
  const opts = getFetchConfig(options, {
    // don't wait forever for third-party failures to be dealt with
    fetchRetries: 0,
  });

  opts.log.silly("verifyNpmPackageAccess");

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return pulseTillDone(access.lsPackages(username, opts)).then(success, failure);

  function success(result) {
    // when _no_ results received, access.lsPackages returns null
    // we can only assume that the packages in question have never been published
    if (result === null) {
      opts.log.warn(
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
      opts.log.warn(
        "EREGISTRY",
        "Registry %j does not support `npm access ls-packages`, skipping permission checks...",
        // registry
        opts.registry
      );

      // don't log redundant errors
      return;
    }

    // Log the error cleanly to stderr
    opts.log.pause();
    console.error(err.message); // eslint-disable-line no-console
    opts.log.resume();

    throw new ValidationError("EWHOAMI", "Authentication error. Use `npm whoami` to troubleshoot.");
  }
}
