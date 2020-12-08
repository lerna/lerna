"use strict";

const fetch = require("npm-registry-fetch");
const { pulseTillDone } = require("@lerna/pulse-till-done");

module.exports.getWhoAmI = getWhoAmI;

/**
 * Retrieve logged-in user's username via legacy API.
 * @param {import("./fetch-config").FetchConfig} opts
 * @returns {WhoIAm}
 */
function getWhoAmI(opts) {
  opts.log.verbose("", "Retrieving npm username");

  return pulseTillDone(fetch.json("/-/whoami", opts)).then((data) => {
    opts.log.silly("npm whoami", "received %j", data);

    // { username: String }
    return data;
  });
}

/**
 * @typedef {object} WhoIAm
 * @property {string} username
 */
