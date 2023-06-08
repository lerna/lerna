import { pulseTillDone, ValidationError } from "@lerna/core";
import access from "libnpmaccess";

import { FetchConfig, getFetchConfig } from "./fetch-config";

/**
 * Throw an error if the logged-in user does not have read-write access to all packages.
 */
export function verifyNpmPackageAccess(
  packages: { name: string }[],
  username: string,
  options: Partial<FetchConfig>
): Promise<void> {
  const opts = getFetchConfig(options, {
    // don't wait forever for third-party failures to be dealt with
    fetchRetries: 0,
  });

  opts.log.silly("verifyNpmPackageAccess", "");

  return pulseTillDone(access.getPackages(username, opts)).then(success, failure);

  function success(result) {
    const userPackages = Object.keys(result || {});
    if (userPackages.length === 0) {
      opts.log.warn(
        "",
        "The logged-in user does not have any previously-published packages, skipping permission checks..."
      );
      return;
    }

    for (const pkg of packages) {
      if (pkg.name in result && result[pkg.name] !== "read-write") {
        throw new ValidationError(
          "EACCESS",
          `You do not have write permission required to publish "${pkg.name}"`
        );
      }
    }
  }

  function failure(err) {
    // pass if registry does not support the package endpoint
    if (err.code === "E500" || err.code === "E404") {
      // most likely a private registry (npm Enterprise, verdaccio, etc)
      opts.log.warn(
        "EREGISTRY",
        "Registry %j does not support `npm access list packages`, skipping permission checks...",
        // registry
        opts.registry
      );

      // don't log redundant errors
      return;
    }

    // Log the error cleanly to stderr
    opts.log.pause();
    console.error(err.message);
    opts.log.resume();

    throw new ValidationError("EWHOAMI", "Authentication error. Use `npm whoami` to troubleshoot.");
  }
}
