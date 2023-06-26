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
  log.silly("getProjectsWithUnpublishedPackages", "");

  const mapper = (node: ProjectGraphProjectNodeWithPackage) => {
    const pkg = getPackage(node);
    // libnpmpublish / npm-registry-fetch check strictSSL rather than strict-ssl
    opts["strictSSL"] = opts["strict-ssl"];
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
