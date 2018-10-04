"use strict";

const log = require("npmlog");
const fetch = require("npm-registry-fetch");
const ValidationError = require("@lerna/validation-error");

module.exports = getNpmUsername;

function getNpmUsername(opts) {
  log.info("", "Verifying npm credentials");

  return fetch.json("-/whoami", opts).then(success, failure);

  function success(result) {
    log.silly("npm whoami", "received %j", result);

    if (!result.username) {
      throw new ValidationError(
        "ENEEDAUTH",
        "You must be logged in to publish packages. Use `npm login` and try again."
      );
    }

    return result.username;
  }

  // catch request errors, not auth expired errors
  function failure(err) {
    // Log the error cleanly to stderr
    log.pause();
    console.error(err.message); // eslint-disable-line no-console
    log.resume();

    if (opts.get("registry") === "https://registry.npmjs.org/") {
      throw new ValidationError("EWHOAMI", "Authentication error. Use `npm whoami` to troubleshoot.");
    }

    log.warn(
      "EWHOAMI",
      "Unable to determine npm username from third-party registry, this command will likely fail soon!"
    );
  }
}
