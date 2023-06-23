import log from "npmlog";

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
  return {
    log,
    ...options,
    ...extra,
  };
}
