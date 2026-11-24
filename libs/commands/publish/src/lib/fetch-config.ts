import { log } from "@lerna/core";

export interface FetchConfig {
  [key: string]: unknown;
  fetchRetries?: number;
  log: typeof log;
  registry?: string;
  username?: string;
}

/**
 * Create a merged options object suitable for npm-registry-fetch.
 */
export function getFetchConfig(options: Partial<FetchConfig>, extra: Partial<FetchConfig>): FetchConfig {
  // npm-registry-fetch reads opts.userAgent, not the `user-agent` config key.
  const userAgent = extra["userAgent"] ?? options["userAgent"] ?? options["user-agent"];

  return {
    log,
    ...options,
    ...extra,
    ...(typeof userAgent === "string" && userAgent ? { userAgent } : {}),
  };
}
