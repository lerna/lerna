import { pulseTillDone } from "@lerna/core";
import fetch from "npm-registry-fetch";

module.exports.getWhoAmI = getWhoAmI;

/**
 * Retrieve logged-in user's username via legacy API.
 * @param {import("./fetch-config").FetchConfig} opts
 * @returns {WhoIAm}
 */
function getWhoAmI(opts) {
  opts.log.verbose("", "Retrieving npm username");

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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
