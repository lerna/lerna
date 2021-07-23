"use strict";

const fs = require("fs-extra");
const path = require("path");
const log = require("npmlog");
const { publish } = require("libnpmpublish");
const pify = require("pify");
const readJSON = require("read-package-json");
const { runLifecycle } = require("@lerna/run-lifecycle");
const npa = require("npm-package-arg");
const { otplease } = require("@lerna/otplease");

module.exports.npmPublish = npmPublish;

const readJSONAsync = pify(readJSON);

/**
 * @typedef {object} NpmPublishOptions
 * @property {boolean} [dryRun]
 * @property {string} [tag] Passed to libnpmpublish as `opts.defaultTag` to preserve npm v6 back-compat
 */

/**
 * Alias dash-cased npmConf to camelCase
 * @param {NpmPublishOptions} obj
 * @returns {NpmPublishOptions}
 */
function flattenOptions(obj) {
  return {
    // eslint-disable-next-line dot-notation -- (npm v7 compat)
    defaultTag: obj["tag"] || "latest",
    dryRun: obj["dry-run"],
    // libnpmpublish / npm-registry-fetch check strictSSL rather than strict-ssl
    strictSSL: obj["strict-ssl"],
    ...obj,
  };
}

/**
 * @typedef {import('npm-registry-fetch').FetchOptions & { access?: 'public' | 'restricted'; defaultTag?: string; }} LibNpmPublishOptions https://github.com/npm/libnpmpublish#opts
 */

/**
 * Publish a package to the configured registry.
 * @param {import("@lerna/package").Package} pkg
 * @param {string} tarFilePath
 * @param {LibNpmPublishOptions & NpmPublishOptions} [options]
 * @param {import("@lerna/otplease").OneTimePasswordCache} [otpCache]
 */
function npmPublish(pkg, tarFilePath, options = {}, otpCache) {
  const { dryRun, ...remainingOptions } = flattenOptions(options);
  const { scope } = npa(pkg.name);
  // pass only the package scope to libnpmpublish
  const opts = {
    log,
    ...remainingOptions,
    projectScope: scope,
  };

  opts.log.verbose("publish", pkg.name);

  let chain = Promise.resolve();

  if (!dryRun) {
    chain = chain.then(() => {
      let { manifestLocation } = pkg;

      if (pkg.contents !== pkg.location) {
        // "rebase" manifest used to generated directory
        manifestLocation = path.join(pkg.contents, "package.json");
      }

      return Promise.all([fs.readFile(tarFilePath), readJSONAsync(manifestLocation)]);
    });
    chain = chain.then(([tarData, manifest]) => {
      // non-default tag needs to override publishConfig.tag,
      // which is merged into opts below if necessary
      if (
        opts.defaultTag !== "latest" &&
        manifest.publishConfig &&
        manifest.publishConfig.tag &&
        manifest.publishConfig.tag !== opts.defaultTag
      ) {
        // eslint-disable-next-line no-param-reassign
        manifest.publishConfig.tag = opts.defaultTag;
      }

      // publishConfig is no longer consumed in n-r-f, so merge here
      if (manifest.publishConfig) {
        Object.assign(opts, publishConfigToOpts(manifest.publishConfig));
      }

      return otplease((innerOpts) => publish(manifest, tarData, innerOpts), opts, otpCache).catch((err) => {
        opts.log.silly("", err);
        opts.log.error(err.code, (err.body && err.body.error) || err.message);

        // avoid dumping logs, this isn't a lerna problem
        err.name = "ValidationError";

        // ensure process exits non-zero
        process.exitCode = "errno" in err ? err.errno : 1;

        // re-throw to break chain upstream
        throw err;
      });
    });
  }

  chain = chain.then(() => runLifecycle(pkg, "publish", opts));
  chain = chain.then(() => runLifecycle(pkg, "postpublish", opts));

  return chain;
}

/**
 * @typedef {object} PackagePublishConfig
 * @property {'public' | 'restricted'} [access]
 * @property {string} [registry]
 * @property {string} [tag]
 */

/**
 * Obtain an object suitable for assignment onto existing options from `pkg.publishConfig`.
 * @param {PackagePublishConfig} publishConfig
 * @returns {Omit<PackagePublishConfig, 'tag'> & { defaultTag?: string }}
 */
function publishConfigToOpts(publishConfig) {
  const opts = { ...publishConfig };

  // npm v7 renamed tag internally
  if (publishConfig.tag) {
    opts.defaultTag = publishConfig.tag;
    delete opts.tag;
  }

  return opts;
}
