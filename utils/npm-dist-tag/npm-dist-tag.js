"use strict";

const log = require("npmlog");
const npa = require("npm-package-arg");
const fetch = require("npm-registry-fetch");
const { otplease } = require("@lerna/otplease");

exports.add = add;
exports.remove = remove;
exports.list = list;

/**
 * @typedef {fetch.FetchOptions & { defaultTag?: string; dryRun?: boolean; }} DistTagOptions
 */

/**
 * Add a dist-tag to a package.
 * @param {string} spec
 * @param {string} [tag]
 * @param {DistTagOptions} options
 * @param {import("@lerna/otplease").OneTimePasswordCache} otpCache
 */
function add(spec, tag, options, otpCache) {
  const opts = {
    log,
    ...options,
    spec: npa(spec),
  };
  const cleanTag = (tag || opts.defaultTag || opts.tag).trim();

  const { name, rawSpec: version } = opts.spec;

  opts.log.verbose("dist-tag", `adding "${cleanTag}" to ${name}@${version}`);

  // istanbul ignore next
  if (opts.dryRun) {
    opts.log.silly("dist-tag", "dry-run configured, bailing now");
    return Promise.resolve();
  }

  return fetchTags(opts).then((tags) => {
    if (tags[cleanTag] === version) {
      opts.log.warn("dist-tag", `${name}@${cleanTag} already set to ${version}`);
      return tags;
    }

    const uri = `/-/package/${opts.spec.escapedName}/dist-tags/${encodeURIComponent(cleanTag)}`;
    const payload = {
      ...opts,
      method: "PUT",
      body: JSON.stringify(version),
      headers: {
        // cannot use fetch.json() due to HTTP 204 response,
        // so we manually set the required content-type
        "content-type": "application/json",
      },
      spec: opts.spec,
    };

    // success returns HTTP 204, thus no JSON to parse
    return otplease((wrappedPayload) => fetch(uri, wrappedPayload), payload, otpCache).then(() => {
      opts.log.verbose("dist-tag", `added "${cleanTag}" to ${name}@${version}`);

      // eslint-disable-next-line no-param-reassign
      tags[cleanTag] = version;

      return tags;
    });
  });
}

/**
 * Remove a dist-tag from a package.
 * @param {string} spec
 * @param {string} tag
 * @param {DistTagOptions} options
 * @param {import("@lerna/otplease").OneTimePasswordCache} otpCache
 */
function remove(spec, tag, options, otpCache) {
  const opts = {
    log,
    ...options,
    spec: npa(spec),
  };

  opts.log.verbose("dist-tag", `removing "${tag}" from ${opts.spec.name}`);

  // istanbul ignore next
  if (opts.dryRun) {
    opts.log.silly("dist-tag", "dry-run configured, bailing now");
    return Promise.resolve();
  }

  return fetchTags(opts).then((tags) => {
    const version = tags[tag];

    if (!version) {
      opts.log.info("dist-tag", `"${tag}" is not a dist-tag on ${opts.spec.name}`);
      return tags;
    }

    const uri = `/-/package/${opts.spec.escapedName}/dist-tags/${encodeURIComponent(tag)}`;
    const payload = {
      ...opts,
      method: "DELETE",
      spec: opts.spec,
    };

    // the delete properly returns a 204, so no json to parse
    return otplease((wrappedPayload) => fetch(uri, wrappedPayload), payload, otpCache).then(() => {
      opts.log.verbose("dist-tag", `removed "${tag}" from ${opts.spec.name}@${version}`);

      // eslint-disable-next-line no-param-reassign
      delete tags[tag];

      return tags;
    });
  });
}

/**
 * List dist-tags of a package.
 * @param {string} spec
 * @param {DistTagOptions} options
 */
function list(spec, options) {
  const opts = {
    log,
    ...options,
    spec: npa(spec),
  };

  // istanbul ignore next
  if (opts.dryRun) {
    opts.log.silly("dist-tag", "dry-run configured, bailing now");
    return Promise.resolve();
  }

  return fetchTags(opts);
}

/**
 * Retrieve list of dist-tags for a package.
 * @param {Omit<fetch.FetchOptions, 'spec'> & { spec: npa.Result }} opts
 */
function fetchTags(opts) {
  return fetch
    .json(`/-/package/${opts.spec.escapedName}/dist-tags`, {
      ...opts,
      preferOnline: true,
      spec: opts.spec,
    })
    .then((data) => {
      if (data && typeof data === "object") {
        // eslint-disable-next-line no-param-reassign, no-underscore-dangle
        delete data._etag;
      }

      return data || {};
    });
}
