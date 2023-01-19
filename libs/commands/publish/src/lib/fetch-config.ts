import log from "npmlog";

module.exports.getFetchConfig = getFetchConfig;

/**
 * Create a merged options object suitable for npm-registry-fetch.
 * @param {{ [key: string]: unknown }} options
 * @param {Partial<FetchConfig>} [extra]
 * @returns {FetchConfig}
 */
function getFetchConfig(options, extra) {
  return {
    log,
    ...options,
    ...extra,
  };
}

/**
 * @typedef {object} FetchConfig
 * @property {number} [fetchRetries]
 * @property {typeof log} log
 * @property {string} [registry]
 * @property {string} [username]
 */
