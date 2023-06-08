import { Package, Project } from "@lerna/core";
import path from "path";

/**
 * Retrieve a list of packages that lack a license file.
 */
export function getPackagesWithoutLicense(
  project: Project,
  packagesToPublish: Package[]
): Promise<Package[]> {
  return project.getPackageLicensePaths().then((licensePaths) => {
    // this assumes any existing license is a sibling of package.json, which is pretty safe
    // it also dedupes package locations, since we don't care about duplicate license files
    const licensed = new Set(licensePaths.map((lp) => path.dirname(lp)));

    return packagesToPublish.filter((pkg) => !licensed.has(pkg.location));
  });
}
