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
  bumper.config(config);
  bumper.commits({ path: pkg.location });

  if (type === "independent") {
    bumper.tag({ prefix: packagePrefix(pkg.name) });
  } else {
    // only fixed mode can have a custom tag prefix
    bumper.tag({ prefix: tagPrefix || "v" });
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
