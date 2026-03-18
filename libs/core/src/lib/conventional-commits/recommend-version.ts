import semver from "semver";
import log from "../npmlog";
import { Package } from "../package";
import { applyBuildMetadata } from "./apply-build-metadata";
import { BaseChangelogOptions, VersioningStrategy } from "./constants";
import { getChangelogConfig } from "./get-changelog-config";

export async function recommendVersion(
  pkg: Package,
  type: VersioningStrategy,
  {
    changelogPreset,
    rootPath,
    tagPrefix,
    prereleaseId,
    conventionalBumpPrerelease,
    buildMetadata,
  }: BaseChangelogOptions & { prereleaseId?: string; buildMetadata?: string },
  premajorVersionBump: "default" | "force-patch"
): Promise<string> {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  const [config, { Bumper, packagePrefix }] = await Promise.all([
    getChangelogConfig(changelogPreset, rootPath),
    // @ts-expect-error ESM package with exports field not resolved by moduleResolution: "node"
    import("conventional-recommended-bump") as Promise<typeof import("conventional-recommended-bump")>,
  ]);

  const bumper = new Bumper();
  // For legacy presets, recommendedBumpOpts.parserOpts are bump-specific overrides
  // (e.g. different noteKeywords or headerPattern) that historically only applied to
  // version bump calculation, not changelog rendering. Apply them here only.
  const bumpConfig =
    config.recommendedBumpOpts?.parserOpts
      ? { ...config, parser: { ...config.parser, ...config.recommendedBumpOpts.parserOpts } }
      : config;
  bumper.config(bumpConfig);
  bumper.commits({ path: pkg.location });

  if (type === "independent") {
    bumper.tag({ prefix: packagePrefix(pkg.name) });
  } else {
    // only fixed mode can have a custom tag prefix
    bumper.tag({ prefix: tagPrefix ?? "v" });
  }

  // Pass whatBump explicitly — Bumper.config() only composes params,
  // it does not extract whatBump from the config (only loadPreset() does that).
  const data = await bumper.bump(config.whatBump);

  const shouldBumpPrerelease = (releaseType: string, version: string | semver.SemVer) => {
    if (!semver.prerelease(version)) {
      return true;
    }
    switch (releaseType) {
      case "major":
        return semver.minor(version) !== 0 || semver.patch(version) !== 0;
      case "minor":
        return semver.patch(version) !== 0;
      default:
        return false;
    }
  };

  // result might be undefined because some presets are not consistent with angular
  // we still need to bump _something_ because lerna saw a change here
  let releaseType = ("releaseType" in data ? data.releaseType : undefined) || "patch";

  if (prereleaseId) {
    const shouldBump = conventionalBumpPrerelease || shouldBumpPrerelease(releaseType, pkg.version);
    const prereleaseType = shouldBump ? `pre${releaseType}` : "prerelease";
    log.verbose(type, "increment %s by %s", pkg.version, prereleaseType);
    return applyBuildMetadata(
      semver.inc(pkg.version, prereleaseType as semver.ReleaseType, prereleaseId)!,
      buildMetadata as string
    );
  } else {
    if (semver.major(pkg.version) === 0) {
      // According to semver, major version zero (0.y.z) is for initial
      // development. Anything MAY change at any time. The public API
      // SHOULD NOT be considered stable. The version 1.0.0 defines
      // the (initial stable) public API.
      //
      // To allow monorepos to use major version zero meaningfully,
      // the transition from 0.x to 1.x must be explicitly requested
      // by the user. Breaking changes MUST NOT automatically bump
      // the major version from 0.x to 1.x.
      //
      // The usual convention is to use semver-patch bumps for bugfix
      // releases and semver-minor for everything else, including
      // breaking changes. This matches the behavior of `^` operator
      // as implemented by `npm`.
      //
      // In node-semver, it is however also documented that
      // "Many authors treat a 0.x version as if the x were the major "breaking-change" indicator."
      // and all other features or bug fixes as semver-patch bumps
      // this can be enabled in lerna through `premajorVersionBump = "force-patch"`
      if (releaseType === "major") {
        releaseType = "minor";
      } else if (premajorVersionBump === "force-patch") {
        releaseType = "patch";
      }
    }
    log.verbose(type, "increment %s by %s", pkg.version, releaseType);
    return applyBuildMetadata(
      semver.inc(pkg.version, releaseType as semver.ReleaseType)!,
      buildMetadata as string
    );
  }
}
