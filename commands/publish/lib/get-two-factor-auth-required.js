"use strict";

const profile = require("libnpm/profile");
const ValidationError = require("@lerna/validation-error");
const FetchConfig = require("./fetch-config");

module.exports = getTwoFactorAuthRequired;

function getTwoFactorAuthRequired(_opts) {
  const opts = FetchConfig(_opts, {
    // don't wait forever for third-party failures to be dealt with
    "fetch-retries": 0,
  });

  opts.log.silly("getTwoFactorAuthRequired", opts.registry);

  return profile.get(opts).then(success, failure);

  function success(result) {
    opts.log.silly("2FA", result.tfa);

    if (result.tfa.pending) {
      // if 2FA is pending, it is disabled
      return false;
    }

    return result.tfa.mode === "auth-and-writes";
  }

  function failure(err) {
    // pass if registry does not support profile endpoint
    if (err.code === "E500" || err.code === "E404") {
      // most likely a private registry (npm Enterprise, verdaccio, etc)
      opts.log.warn(
        "EREGISTRY",
        "Registry %j does not support `npm profile get`, skipping two-factor auth check...",
        // registry
        opts.registry
      );

      // don't log redundant errors
      return false;
    }

    // Log the error cleanly to stderr
    opts.log.pause();
    console.error(err.message); // eslint-disable-line no-console
    opts.log.resume();

    throw new ValidationError("ETWOFACTOR", "Unable to obtain two-factor auth mode");
  }
}
