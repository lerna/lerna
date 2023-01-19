import npa from "npm-package-arg";
import fetch from "npm-registry-fetch";
import log from "npmlog";
import { OneTimePasswordCache, otplease } from "./otplease";

interface DistTagOptions extends fetch.FetchOptions {
  defaultTag?: string;
  dryRun?: boolean;
}

/**
 * Add a dist-tag to a package.
 */
export function add(
  spec: string,
  tag: string | undefined,
  options: DistTagOptions,
  otpCache?: OneTimePasswordCache
) {
  const opts = {
    log,
    ...options,
    spec: npa(spec),
  };

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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
 */
export function remove(spec: string, tag: string, options: DistTagOptions, otpCache?: OneTimePasswordCache) {
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
 */
export function list(spec: string, options: DistTagOptions) {
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
 */
function fetchTags(opts: Omit<fetch.FetchOptions, "spec"> & { spec: npa.Result }) {
  return fetch
    .json(`/-/package/${opts.spec.escapedName}/dist-tags`, {
      ...opts,
      preferOnline: true,
      spec: opts.spec,
    })
    .then((data) => {
      if (data && typeof data === "object") {
        // eslint-disable-next-line no-param-reassign, no-underscore-dangle
        delete data["_etag"];
      }

      return data || {};
    });
}
