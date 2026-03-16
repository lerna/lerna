// @ts-expect-error ESM package with exports field not resolved by moduleResolution: "node"
import { Bumper, packagePrefix } from "conventional-recommended-bump";
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

  const config = await getChangelogConfig(changelogPreset, rootPath);

  const bumper = new Bumper();
  bumper.config(config);
  bumper.commits({ path: pkg.location });

  if (type === "independent") {
    bumper.tag({ prefix: packagePrefix(pkg.name) });
  } else {
    // only fixed mode can have a custom tag prefix
    bumper.tag({ prefix: tagPrefix || "v" });
  }

  const data = await bumper.bump();

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
    // @ts-expect-error semver.inc can return null but applyBuildMetadata expects string
    return applyBuildMetadata(semver.inc(pkg.version, prereleaseType, prereleaseId), buildMetadata);
  } else {
    if (semver.major(pkg.version) === 0) {
      if (releaseType === "major") {
        releaseType = "minor";
      } else if (premajorVersionBump === "force-patch") {
        releaseType = "patch";
      }
    }
    log.verbose(type, "increment %s by %s", pkg.version, releaseType);
    // @ts-expect-error semver.inc can return null but applyBuildMetadata expects string
    return applyBuildMetadata(semver.inc(pkg.version, releaseType), buildMetadata);
  }
}
