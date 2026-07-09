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
 * Normalize the new conventional-changelog preset API (v8+) to the legacy
 * format expected by conventional-changelog-core@5 and conventional-recommended-bump@7.
 *
 * New API shape:   { parser, writer, commits, whatBump }
 * Legacy API shape: { parserOpts, writerOpts, gitRawCommitsOpts, conventionalChangelog, recommendedBumpOpts }
 */
function normalizeNewPresetConfig(config: any): any {
  if (
    config &&
    (config.parser || config.writer) &&
    !config.parserOpts &&
    !config.writerOpts &&
    !config.conventionalChangelog
  ) {
    log.verbose("getChangelogConfig", "Normalizing new preset API to legacy format");

    const normalized: any = { ...config };

    if (config.parser) {
      normalized.parserOpts = config.parser;
    }
    if (config.writer) {
      normalized.writerOpts = config.writer;
    }
    if (config.commits) {
      normalized.gitRawCommitsOpts = config.commits;
    }

    normalized.conventionalChangelog = {
      parserOpts: normalized.parserOpts,
      writerOpts: normalized.writerOpts,
    };
    if (normalized.gitRawCommitsOpts) {
      normalized.conventionalChangelog.gitRawCommitsOpts = normalized.gitRawCommitsOpts;
    }

    if (config.whatBump) {
      normalized.recommendedBumpOpts = {
        parserOpts: normalized.parserOpts,
        whatBump: config.whatBump,
      };
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

  return normalizeNewPresetConfig(config);
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
