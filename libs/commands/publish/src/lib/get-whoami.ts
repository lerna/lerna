import { pulseTillDone } from "@lerna/core";
import fetch from "npm-registry-fetch";
import { FetchConfig } from "./fetch-config";

export interface WhoIAm {
  username: string;
}

/**
 * Retrieve logged-in user's username via legacy API.
 */
export function getWhoAmI(opts: FetchConfig): WhoIAm {
  opts.log.verbose("", "Retrieving npm username");

  return pulseTillDone(fetch.json("/-/whoami", opts)).then((data: WhoIAm) => {
    opts.log.silly("npm whoami", "received %j", data);

    return data;
  });
}
