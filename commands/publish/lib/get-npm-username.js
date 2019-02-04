"use strict";

const fetch = require("npm-registry-fetch");
const pulseTillDone = require("@lerna/pulse-till-done");
const ValidationError = require("@lerna/validation-error");
const FetchConfig = require("./fetch-config");

module.exports = getNpmUsername;

function getNpmUsername(_opts) {
  const opts = FetchConfig(_opts, {
    // don't wait forever for third-party failures to be dealt with
    "fetch-retries": 0,
  });

  opts.log.info("", "Verifying npm credentials");

  return getProfileData(opts).then(success, failure);

  function success(result) {
    opts.log.silly("npm profile get", "received %j", result);

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

function getProfileData(opts) {
  opts.log.verbose("", "Retrieving npm user profile");

  return pulseTillDone(fetch.json("/-/npm/v1/user", opts))
    .then(data => {
      opts.log.silly("npm profile get", "received %j", data);

      const result = {
        // remap to match legacy whoami format
        username: data.name,
      };

      return result;
    })
    .catch(err => {
      // Many third-party registries do not implement the user endpoint
      // Legacy npm Enterprise returns E500 instead of E404
      if (err.code === "E500" || err.code === "E404") {
        return getWhoAmI(opts);
      }

      // re-throw 401 Unauthorized (and all other unexpected errors)
      throw err;
    });
}

function getWhoAmI(opts) {
  opts.log.verbose("", "Retrieving npm username");

  return pulseTillDone(fetch.json("/-/whoami", opts)).then(data => {
    opts.log.silly("npm whoami", "received %j", data);

    // { username: String }
    return data;
  });
}
