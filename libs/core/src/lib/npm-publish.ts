import { load } from "@npmcli/package-json";
import fs from "fs-extra";
import { publish } from "libnpmpublish";
import npa from "npm-package-arg";
import { FetchOptions } from "npm-registry-fetch";
import log from "npmlog";
import path from "path";
import { OneTimePasswordCache, otplease } from "./otplease";
import { Package } from "./package";
import { runLifecycle } from "./run-lifecycle";

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
export async function npmPublish(
  pkg: Package,
  tarFilePath: string,
  options: LibNpmPublishOptions & NpmPublishOptions = {},
  otpCache?: OneTimePasswordCache
): Promise<void | Response> {
  const { dryRun, ...remainingOptions } = flattenOptions(options);
  const { scope } = npa(pkg.name);
  // pass only the package scope to libnpmpublish
  const opts = {
    log,
    ...remainingOptions,
    projectScope: scope,
  };

  opts.log.verbose("publish", pkg.name);

  let result: undefined | Response;

  if (!dryRun) {
    let { manifestLocation } = pkg;

    if (pkg.contents !== pkg.location) {
      // "rebase" manifest used to generated directory
      manifestLocation = path.join(pkg.contents, "package.json");
    }

    const [tarData, npmCliPackageJson] = await Promise.all([
      fs.readFile(tarFilePath),
      await load(manifestLocation),
    ]);

    const manifestContent = npmCliPackageJson.content;

    // non-default tag needs to override publishConfig.tag,
    // which is merged into opts below if necessary
    if (
      opts.defaultTag !== "latest" &&
      manifestContent.publishConfig &&
      manifestContent.publishConfig.tag &&
      manifestContent.publishConfig.tag !== opts.defaultTag
    ) {
      manifestContent.publishConfig.tag = opts.defaultTag;
    }

    // publishConfig is no longer consumed in n-r-f, so merge here
    if (manifestContent.publishConfig) {
      Object.assign(opts, publishConfigToOpts(manifestContent.publishConfig));
    }

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    result = await otplease((innerOpts) => publish(manifestContent, tarData, innerOpts), opts, otpCache);
  }

  await runLifecycle(pkg, "publish", opts);
  await runLifecycle(pkg, "postpublish", opts);

  return result;
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
