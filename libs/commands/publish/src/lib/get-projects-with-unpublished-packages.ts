import { getPackage, ProjectGraphProjectNodeWithPackage } from "@lerna/core";
import log from "npmlog";
import pMap from "p-map";
import pacote from "pacote";
import { FetchConfig } from "./fetch-config";

/**
 * Retrieve a list of graph nodes for packages that need to be published.
 */
export async function getProjectsWithUnpublishedPackages(
  projectNodes: ProjectGraphProjectNodeWithPackage[],
  opts: Partial<FetchConfig>
): Promise<ProjectGraphProjectNodeWithPackage[]> {
  log.silly("getUnpublishedPackages", "");

  const mapper = (node: ProjectGraphProjectNodeWithPackage) => {
    const pkg = getPackage(node);
    // if a package doesn't have an explicit version, we have nothing to compare against
    if (!pkg.version) {
      return undefined;
    }
    return pacote.packument(pkg.name, opts).then(
      (packument) => {
        if (packument.versions === undefined || packument.versions[pkg.version] === undefined) {
          return node;
        }
      },
      () => {
        log.warn("", "Unable to determine published version, assuming %j unpublished.", pkg.name);
        return node;
      }
    );
  };

  const results = await pMap(projectNodes, mapper, { concurrency: 4 });

  return results.filter(Boolean);
}
