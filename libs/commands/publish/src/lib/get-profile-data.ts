import { pulseTillDone } from "@lerna/core";
import fetch from "npm-registry-fetch";
import { FetchConfig } from "./fetch-config";

export interface ProfileData {
  tfa: {
    pending: boolean;
    mode: "auth-and-writes" | "auth-only";
  };
  name: string;
  username: string; // legacy field alias of `name`
  email: string;
  email_verified: boolean;
  created: string;
  updated: string;
  fullname?: string;
  twitter?: string;
  github?: string;
}

/**
 * Retrieve profile data of logged-in user.
 */
export function getProfileData(opts: FetchConfig): Promise<ProfileData> {
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
