"use strict";

const log = require("npmlog");
const npa = require("npm-package-arg");
const fetch = require("@evocateur/npm-registry-fetch");
const figgyPudding = require("figgy-pudding");
const otplease = require("@lerna/otplease");

exports.add = add;
exports.remove = remove;
exports.list = list;

const DistTagConfig = figgyPudding(
  {
    log: { default: log },
    spec: {},
    tag: {},
  },
  {
    other() {
      // open it up for the sake of tests
      return true;
    },
  }
);

function add(spec, tag, _opts, otpCache) {
  const opts = DistTagConfig(_opts, {
    spec: npa(spec),
    tag,
  });
  const cleanTag = opts.tag.trim();

  const { name, rawSpec: version } = opts.spec;

  opts.log.verbose("dist-tag", `adding "${cleanTag}" to ${name}@${version}`);

  return fetchTags(opts).then(tags => {
    if (tags[cleanTag] === version) {
      opts.log.warn("dist-tag", `${name}@${cleanTag} already set to ${version}`);
      return tags;
    }

    const uri = `/-/package/${opts.spec.escapedName}/dist-tags/${encodeURIComponent(cleanTag)}`;
    const payload = opts.concat({
      method: "PUT",
      body: JSON.stringify(version),
      headers: {
        // cannot use fetch.json() due to HTTP 204 response,
        // so we manually set the required content-type
        "content-type": "application/json",
      },
      spec: opts.spec,
    });

    // success returns HTTP 204, thus no JSON to parse
    return otplease(wrappedPayload => fetch(uri, wrappedPayload), payload, otpCache).then(() => {
      opts.log.verbose("dist-tag", `added "${cleanTag}" to ${name}@${version}`);

      // eslint-disable-next-line no-param-reassign
      tags[cleanTag] = version;

      return tags;
    });
  });
}

function remove(spec, tag, _opts, otpCache) {
  const opts = DistTagConfig(_opts, {
    spec: npa(spec),
  });

  opts.log.verbose("dist-tag", `removing "${tag}" from ${opts.spec.name}`);

  return fetchTags(opts).then(tags => {
    const version = tags[tag];

    if (!version) {
      opts.log.info("dist-tag", `"${tag}" is not a dist-tag on ${opts.spec.name}`);
      return tags;
    }

    const uri = `/-/package/${opts.spec.escapedName}/dist-tags/${encodeURIComponent(tag)}`;
    const payload = opts.concat({
      method: "DELETE",
    });

    // the delete properly returns a 204, so no json to parse
    return otplease(wrappedPayload => fetch(uri, wrappedPayload), payload, otpCache).then(() => {
      opts.log.verbose("dist-tag", `removed "${tag}" from ${opts.spec.name}@${version}`);

      // eslint-disable-next-line no-param-reassign
      delete tags[tag];

      return tags;
    });
  });
}

function list(spec, _opts) {
  const opts = DistTagConfig(_opts, {
    spec: npa(spec),
  });

  return fetchTags(opts);
}

function fetchTags(opts) {
  return fetch
    .json(
      `/-/package/${opts.spec.escapedName}/dist-tags`,
      opts.concat({
        "prefer-online": true,
        spec: opts.spec,
      })
    )
    .then(data => {
      if (data && typeof data === "object") {
        // eslint-disable-next-line no-param-reassign, no-underscore-dangle
        delete data._etag;
      }

      return data || {};
    });
}
