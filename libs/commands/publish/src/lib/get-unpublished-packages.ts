import { PackageGraph, PackageGraphNode } from "@lerna/legacy-core";
import log from "npmlog";
import pMap from "p-map";
import pacote from "pacote";
import { FetchConfig } from "./fetch-config";

/**
 * Retrieve a list of graph nodes for packages that need to be published.
 */
export async function getUnpublishedPackages(
  packageGraph: PackageGraph,
  opts: Partial<FetchConfig>
): Promise<PackageGraphNode[]> {
  log.silly("getUnpublishedPackages", "");

  const graphNodesToCheck = Array.from(packageGraph.values());

  const mapper = (pkg: PackageGraphNode) =>
    pacote.packument(pkg.name, opts).then(
      (packument) => {
        if (packument.versions === undefined || packument.versions[pkg.version] === undefined) {
          return pkg;
        }
      },
      () => {
        log.warn("", "Unable to determine published version, assuming %j unpublished.", pkg.name);
        return pkg;
      }
    );

  const results = await pMap(graphNodesToCheck, mapper, { concurrency: 4 });

  return results.filter(Boolean);
}
