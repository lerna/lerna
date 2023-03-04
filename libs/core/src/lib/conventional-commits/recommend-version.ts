import conventionalRecommendedBump from "conventional-recommended-bump";
import log from "npmlog";
import semver from "semver";
import { Package } from "../package";
import { applyBuildMetadata } from "./apply-build-metadata";
import { BaseChangelogOptions, VersioningStrategy } from "./constants";
import { getChangelogConfig } from "./get-changelog-config";

export function recommendVersion(
  pkg: Package,
  type: VersioningStrategy,
  {
    changelogPreset,
    rootPath,
    tagPrefix,
    prereleaseId,
    conventionalBumpPrerelease,
    buildMetadata,
  }: BaseChangelogOptions & { prereleaseId?: string; buildMetadata?: string }
) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  const options: { lernaPackage?: string; tagPrefix?: string; path?: string; config?: any } = {
    path: pkg.location,
  };

  if (type === "independent") {
    options.lernaPackage = pkg.name;
  } else {
    // only fixed mode can have a custom tag prefix
    options.tagPrefix = tagPrefix;
  }

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

  // Ensure potential ValidationError in getChangelogConfig() is propagated correctly
  let chain = Promise.resolve();

  chain = chain.then(() => getChangelogConfig(changelogPreset, rootPath));
  chain = chain.then((config) => {
    // "new" preset API
    options.config = config;

    return new Promise((resolve, reject) => {
      conventionalRecommendedBump(options, (err: any, data: any) => {
        if (err) {
          return reject(err);
        }

        // result might be undefined because some presets are not consistent with angular
        // we still need to bump _something_ because lerna saw a change here
        let releaseType = data.releaseType || "patch";

        if (prereleaseId) {
          const shouldBump = conventionalBumpPrerelease || shouldBumpPrerelease(releaseType, pkg.version);
          const prereleaseType = shouldBump ? `pre${releaseType}` : "prerelease";
          log.verbose(type, "increment %s by %s", pkg.version, prereleaseType);
          // TODO: refactor to address type issues
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          resolve(applyBuildMetadata(semver.inc(pkg.version, prereleaseType, prereleaseId), buildMetadata));
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
            if (releaseType === "major") {
              releaseType = "minor";
            }
          }
          log.verbose(type, "increment %s by %s", pkg.version, releaseType);
          // TODO: refactor to address type issues
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          resolve(applyBuildMetadata(semver.inc(pkg.version, releaseType), buildMetadata));
        }
      });
    });
  });

  return chain;
}
