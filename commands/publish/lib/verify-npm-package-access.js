"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");
const getExecOpts = require("@lerna/get-npm-exec-opts");
const ValidationError = require("@lerna/validation-error");

module.exports = verifyNpmPackageAccess;

function verifyNpmPackageAccess(packages, location, { registry }) {
  log.silly("verifyNpmPackageAccess");

  const args = [
    "access",
    "ls-packages",
    // immediate feedback from request errors, not excruciatingly slow retries
    // @see https://docs.npmjs.com/misc/config#fetch-retries
    "--fetch-retries=0",
    // including http requests makes raw logging easier to debug for end users
    "--loglevel=http",
  ];
  const opts = getExecOpts({ location }, registry);

  // we do not need special log handling
  delete opts.pkg;

  return childProcess.exec("npm", args, opts).then(
    result => {
      const permission = JSON.parse(result.stdout);

      for (const pkg of packages) {
        if (pkg.name in permission && permission[pkg.name] !== "read-write") {
          throw new ValidationError(
            "EACCESS",
            `You do not have write permission required to publish "${pkg.name}"`
          );
        }
      }
    },
    // only catch npm error, not validation error above
    ({ stderr }) => {
      // pass if registry does not support ls-packages endpoint
      if (/E500/.test(stderr) && /ECONNREFUSED/.test(stderr)) {
        // most likely a private registry (npm Enterprise, verdaccio, etc)
        log.warn(
          "EREGISTRY",
          "Registry %j does not support `npm access ls-packages`, skipping permission checks...",
          registry
        );

        // don't log redundant errors
        return;
      }

      if (/ENEEDAUTH/.test(stderr)) {
        throw new ValidationError(
          "ENEEDAUTH",
          "You must be logged in to publish packages. Use `npm login` and try again."
        );
      }

      // Log the error cleanly to stderr, it already has npmlog decorations
      log.pause();
      console.error(stderr); // eslint-disable-line no-console
      log.resume();

      throw new ValidationError("EWHOAMI", "Authentication error. Use `npm whoami` to troubleshoot.");
    }
  );
}
