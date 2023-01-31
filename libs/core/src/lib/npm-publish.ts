import fs from "fs-extra";
import { publish } from "libnpmpublish";
import npa from "npm-package-arg";
import { FetchOptions } from "npm-registry-fetch";
import log from "npmlog";
import path from "path";
import pify from "pify";
import { OneTimePasswordCache, otplease } from "./otplease";
import { Package } from "./package";
import { runLifecycle } from "./run-lifecycle";

// read-package-json does not have any types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const readJSON = require("read-package-json");

const readJSONAsync = pify(readJSON);

interface NpmPublishOptions {
  dryRun?: boolean;
  ["dry-run"]?: boolean;
  ["strict-ssl"]?: boolean;
  tag?: string; // Passed to libnpmpublish as `opts.defaultTag` to preserve npm v6 back-compat
}

/**
 * Alias dash-cased npmConf to camelCase
 */
function flattenOptions(obj: NpmPublishOptions) {
  return {
    // eslint-disable-next-line dot-notation -- (npm v7 compat)
    defaultTag: obj["tag"] || "latest",
    dryRun: obj["dry-run"],
    // libnpmpublish / npm-registry-fetch check strictSSL rather than strict-ssl
    strictSSL: obj["strict-ssl"],
    ...obj,
  };
}

interface LibNpmPublishOptions extends FetchOptions {
  access?: "public" | "restricted";
  defaultTag?: string;
}

/**
 * Publish a package to the configured registry.
 */
export function npmPublish(
  pkg: Package,
  tarFilePath: string,
  options: LibNpmPublishOptions & NpmPublishOptions = {},
  otpCache?: OneTimePasswordCache
) {
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
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chain = chain.then(() => {
      let { manifestLocation } = pkg;

      if (pkg.contents !== pkg.location) {
        // "rebase" manifest used to generated directory
        manifestLocation = path.join(pkg.contents, "package.json");
      }

      return Promise.all([fs.readFile(tarFilePath), readJSONAsync(manifestLocation)]);
    });

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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

      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return otplease((innerOpts) => publish(manifest, tarData, innerOpts), opts, otpCache);
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

interface PackagePublishConfig {
  access?: "public" | "restricted";
  registry?: string;
  tag?: string;
}

/**
 * Obtain an object suitable for assignment onto existing options from `pkg.publishConfig`.
 */
function publishConfigToOpts(
  publishConfig: PackagePublishConfig
): Omit<PackagePublishConfig, "tag"> & { defaultTag?: string } {
  const opts: PackagePublishConfig & { defaultTag?: string } = { ...publishConfig };

  // npm v7 renamed tag internally
  if (publishConfig.tag) {
    opts.defaultTag = publishConfig.tag;
    delete opts.tag;
  }

  return opts;
}
