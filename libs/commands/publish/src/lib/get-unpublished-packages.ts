import log from "npmlog";
import pMap from "p-map";
import pacote from "pacote";

module.exports.getUnpublishedPackages = getUnpublishedPackages;

/**
 * Retrieve a list of graph nodes for packages that need to be published.
 * @param {import("@lerna/package-graph").PackageGraph} packageGraph
 * @param {import("./fetch-config").FetchConfig} opts
 * @returns {Promise<import("@lerna/package-graph").PackageGraphNode[]>}
 */
function getUnpublishedPackages(packageGraph, opts) {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("getUnpublishedPackages");

  let chain = Promise.resolve();

  const graphNodesToCheck = Array.from(packageGraph.values());

  const mapper = (pkg) =>
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

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then(() => pMap(graphNodesToCheck, mapper, { concurrency: 4 }));

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return chain.then((results) => results.filter(Boolean));
}
