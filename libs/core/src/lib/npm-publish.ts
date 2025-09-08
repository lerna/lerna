import { prepare } from "@npmcli/package-json";
import { Conf } from "./npm-conf/conf";
import fs from "fs-extra";
import { GITHUB_ACTIONS, GITLAB } from "ci-info";
import { publish } from "libnpmpublish";
import npa from "npm-package-arg";
import { FetchOptions, json as npmFetchJson } from "npm-registry-fetch";
import path from "path";
import log from "./npmlog";
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
  conf: Conf,
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
      await prepare(path.dirname(manifestLocation)),
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

    await oidc({ pkg, conf, opts });

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

async function oidc({ pkg, conf, opts }: { pkg: Package; conf: Conf; opts: any }) {
  try {
    if (!GITHUB_ACTIONS && !GITLAB) {
      return undefined;
    }

    let idToken = process.env.NPM_ID_TOKEN;
    const registry = conf.get("registry");

    if (!idToken && GITHUB_ACTIONS) {
      if (!(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)) {
        log.verbose("publish", "oidc skipped because incorrect permisions for id-token with Github workflow");
        return undefined;
      }

      const audience = `npm:${new URL(registry).hostname}`;
      const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
      url.searchParams.append("audience", audience);
      const response = await fetch(url.href, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`,
        },
      });

      const json = await response.json();

      if (!response.ok) {
        log.verbose("publish", `failed to fetch OIDC id_token from GitHub: received an invalid response`);
        return undefined;
      }

      if (!(json as { value: string }).value) {
        log.verbose("publish", `failed to fetch OIDC id_token from GitHub: missing value`);
        return undefined;
      }

      idToken = (json as { value: string }).value;
    }

    if (!idToken) {
      log.verbose("publish", "oidc skipped because no id_token available");
      return undefined;
    }

    const parsedRegistry = new URL(registry);
    const regKey = `//${parsedRegistry.host}${parsedRegistry.pathname}`;
    const authTokenKey = `${regKey}:_authToken`;

    const escapedPackageName = npa(pkg.name).escapedName;
    let res;

    try {
      res = await npmFetchJson(
        new URL(`/-/npm/v1/oidc/token/exchange/package/${escapedPackageName}`, registry).toString(),
        {
          ...opts,
          [authTokenKey]: idToken,
          method: "POST",
        }
      );
    } catch (error) {
      log.verbose(
        "publish",
        `Failed token exchange request with body message:: ${error?.body?.message || "Unknown error"}`
      );
      return undefined;
    }

    if (!res?.token) {
      log.verbose(
        "publish",
        '"OIDC: Failed because token exchange was missing the token in the response body"'
      );
      return undefined;
    }
    // Attach token to opts which is passed through to `otplease`.
    opts[authTokenKey] = res.token;
    conf.set(authTokenKey, res.token, "user");
    log.verbose("publish", "Successfully retrieved and set OIDC token");

    try {
      const [headerB64, payloadB64] = idToken.split(".");
      if (headerB64 && payloadB64) {
        const payloadJson = Buffer.from(payloadB64, "base64").toString("utf8");
        const payload = JSON.parse(payloadJson);
        if (
          (GITHUB_ACTIONS && payload.repository_visibility === "public") ||
          // only set provenance for gitlab if the repo is public and SIGSTORE_ID_TOKEN is available
          (GITLAB && payload.project_visibility === "public" && process.env.SIGSTORE_ID_TOKEN)
        ) {
          const isPublic = opts.access === "public";
          if (isPublic) {
            log.verbose("oidc", `Enabling provenance`);
            opts.provenance = true;
            conf.set("provenance", true, "user");
          }
        }
      }
    } catch (error) {
      log.verbose(
        "publish",
        `OIDC: Failed to set provenance with message: ${error?.message || "Unknown error"}`
      );
    }
  } catch (error) {
    log.verbose("publish", `OIDC: Failure with message: ${error?.message || "Unknown error"}`);
  }
}
