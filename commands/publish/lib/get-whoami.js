"use strict";

const fetch = require("@evocateur/npm-registry-fetch");
const pulseTillDone = require("@lerna/pulse-till-done");

module.exports = getWhoAmI;

function getWhoAmI(opts) {
  opts.log.verbose("", "Retrieving npm username");

  return pulseTillDone(fetch.json("/-/whoami", opts)).then(data => {
    opts.log.silly("npm whoami", "received %j", data);

    // { username: String }
    return data;
  });
}
