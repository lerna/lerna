"use strict";

const fetch = require("npm-registry-fetch");
const { pulseTillDone } = require("@lerna/pulse-till-done");

module.exports.getProfileData = getProfileData;

/**
 * Retrieve profile data of logged-in user.
 * @param {import("./fetch-config").FetchConfig} opts
 * @returns {Promise<ProfileData>}
 */
function getProfileData(opts) {
  opts.log.verbose("", "Retrieving npm user profile");

  return pulseTillDone(fetch.json("/-/npm/v1/user", opts)).then((data) => {
    opts.log.silly("npm profile get", "received %j", data);

    return Object.assign(
      // remap to match legacy whoami format
      { username: data.name },
      data
    );
  });
}

/**
 * @typedef {object} ProfileData
 * @property {{ pending: boolean; mode: 'auth-and-writes' | 'auth-only' }} tfa
 * @property {string} name
 * @property {string} username legacy field alias of `name`
 * @property {string} email
 * @property {boolean} email_verified
 * @property {string} created
 * @property {string} updated
 * @property {string} [fullname]
 * @property {string} [twitter]
 * @property {string} [github]
 */
