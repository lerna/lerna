import npa from "npm-package-arg";
import { promisify } from "node:util";
import log from "../npmlog";
import { ValidationError } from "../validation-error";
import { ChangelogPresetConfig } from "./constants";

const cfgCache = new Map();

function isFunction(config: any) {
  return (
    Object.prototype.toString.call(config) === "[object Function]" ||
    Object.prototype.toString.call(config) === "[object AsyncFunction]"
  );
}

/**
 * Normalize legacy conventional-changelog preset API to the modern format
 * expected by conventional-changelog@7+ and conventional-recommended-bump@10+.
 *
 * Legacy API shape: { parserOpts, writerOpts, gitRawCommitsOpts, conventionalChangelog, recommendedBumpOpts }
 * Modern API shape: { parser, writer, commits, whatBump }
 */
function normalizePresetConfig(config: any): any {
  // Already in modern format
  if (
    config &&
    (config.parser || config.writer || config.whatBump) &&
    !config.parserOpts &&
    !config.writerOpts &&
    !config.conventionalChangelog
  ) {
    return config;
  }

  // Legacy format → modern format
  if (
    config &&
    (config.parserOpts ||
      config.writerOpts ||
      config.conventionalChangelog ||
      config.recommendedBumpOpts ||
      config.gitRawCommitsOpts)
  ) {
    log.verbose("getChangelogConfig", "Normalizing legacy preset API to modern format");

    const normalized: any = { ...config };

    // Use conventionalChangelog sub-object if present (some presets wrap config there),
    // but also check top-level properties as fallback since some presets place
    // gitRawCommitsOpts at the top level alongside conventionalChangelog.
    const cc = config.conventionalChangelog || config;

    if (!normalized.parser) {
      normalized.parser = cc.parserOpts || config.parserOpts;
    }
    if (!normalized.writer) {
      normalized.writer = cc.writerOpts || config.writerOpts;
    }
    if (!normalized.commits) {
      normalized.commits = cc.gitRawCommitsOpts || config.gitRawCommitsOpts;
    }
    if (!normalized.whatBump) {
      normalized.whatBump = config.recommendedBumpOpts?.whatBump || config.whatBump;
    }

    return normalized;
  }

  return config;
}

async function resolveConfigPromise(presetPackageName: string, presetConfig: object) {
  log.verbose("getChangelogConfig", "Attempting to resolve preset %j", presetPackageName);

  let config: any;

  try {
    config = require(presetPackageName);
  } catch (requireError: any) {
    if (requireError.code === "ERR_REQUIRE_ESM" || requireError.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") {
      log.verbose("getChangelogConfig", "Preset is ESM, using dynamic import for %j", presetPackageName);
      const imported = await import(presetPackageName);
      config = imported.default || imported;
    } else {
      throw requireError;
    }
  }

  // Node.js 22+ can require() ESM modules, returning a module namespace object
  // with { __esModule, default, ... } instead of the default export directly.
  // Also handles interop wrappers from bundlers (e.g. esbuild, webpack).
  if (config && config.__esModule && config.default) {
    config = config.default;
  }

  log.info("getChangelogConfig", "Successfully resolved preset %j", presetPackageName);

  if (isFunction(config)) {
    try {
      // try assuming config builder function first
      config = config(presetConfig);
    } catch (_) {
      // legacy presets export an errback function instead of Q.all()
      config = promisify(config)();
    }
  }

  config = await Promise.resolve(config);

  return normalizePresetConfig(config);
}

export async function getChangelogConfig(
  changelogPreset: ChangelogPresetConfig = "conventional-changelog-angular",
  rootPath: string
) {
  const presetName = typeof changelogPreset === "string" ? changelogPreset : changelogPreset.name;
  const presetConfig = typeof changelogPreset === "object" ? changelogPreset : {};

  const cacheKey = `${presetName}${presetConfig ? JSON.stringify(presetConfig) : ""}`;

  let config = cfgCache.get(cacheKey);

  if (!config) {
    let presetPackageName = presetName;

    // https://github.com/npm/npm-package-arg#result-object
    const parsed = npa(presetPackageName, rootPath);

    log.verbose("getChangelogConfig", "using preset %j", presetPackageName);
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    log.silly("npa", parsed);

    if (parsed.type === "directory") {
      if (parsed.raw[0] === "@") {
        // npa parses scoped subpath reference as a directory
        parsed.name = parsed.raw;
        parsed.scope = parsed.raw.substring(0, parsed.raw.indexOf("/"));
        // un-scoped subpath shorthand handled in first catch block
      } else {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        presetPackageName = parsed.fetchSpec;
      }
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
    } else if (parsed.type === "git" && parsed.hosted && parsed.hosted.default === "shortcut") {
      // probably a shorthand subpath, e.g. "foo/bar"
      parsed.name = parsed.raw;
    }

    // Maybe it doesn't need an implicit 'conventional-changelog-' prefix?
    try {
      config = await resolveConfigPromise(presetPackageName, presetConfig);

      cfgCache.set(cacheKey, config);

      return config;
    } catch (err: any) {
      log.verbose("getChangelogConfig", err.message);
      log.info("getChangelogConfig", "Auto-prefixing conventional-changelog preset %j", presetName);

      // probably a deep shorthand subpath :P
      parsed.name = parsed.raw;
    }

    if (parsed.name.indexOf("conventional-changelog-") < 0) {
      // implicit 'conventional-changelog-' prefix
      const parts = parsed.name.split("/");
      const start = parsed.scope ? 1 : 0;

      //        foo =>        conventional-changelog-foo
      // @scope/foo => @scope/conventional-changelog-foo
      parts.splice(start, 1, `conventional-changelog-${parts[start]}`);

      // _technically_ supports 'foo/lib/bar.js', but that's gross
      presetPackageName = parts.join("/");
    }

    try {
      config = await resolveConfigPromise(presetPackageName, presetConfig);

      cfgCache.set(cacheKey, config);
    } catch (err: any) {
      log.warn("getChangelogConfig", err.message);

      throw new ValidationError(
        "EPRESET",
        `Unable to load conventional-changelog preset '${presetName}'${
          presetName !== presetPackageName ? ` (${presetPackageName})` : ""
        }`
      );
    }
  }

  return config;
}
