"use strict";

const { ValidationError } = require("@lerna/validation-error");
const { getFetchConfig } = require("./fetch-config");
const { getProfileData } = require("./get-profile-data");
const { getWhoAmI } = require("./get-whoami");

module.exports.getNpmUsername = getNpmUsername;

/**
 * Retrieve username of logged-in user.
 * @param {import("./fetch-config").FetchConfig} options
 * @returns {Promise<string>}
 */
function getNpmUsername(options) {
  const opts = getFetchConfig(options, {
    // don't wait forever for third-party failures to be dealt with
    fetchRetries: 0,
  });

  opts.log.info("", "Verifying npm credentials");

  return getProfileData(opts)
    .catch((err) => {
      // Many third-party registries do not implement the user endpoint
      // Legacy npm Enterprise returns E500 instead of E404
      if (err.code === "E500" || err.code === "E404") {
        return getWhoAmI(opts);
      }

      // re-throw 401 Unauthorized (and all other unexpected errors)
      throw err;
    })
    .then(success, failure);

  function success(result) {
    opts.log.silly("get npm username", "received %j", result);

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
    opts.log.pause();
    console.error(err.message); // eslint-disable-line no-console
    opts.log.resume();

    if (opts.registry === "https://registry.npmjs.org/") {
      throw new ValidationError("EWHOAMI", "Authentication error. Use `npm whoami` to troubleshoot.");
    }

    opts.log.warn(
      "EWHOAMI",
      "Unable to determine npm username from third-party registry, this command will likely fail soon!"
    );
  }
}
