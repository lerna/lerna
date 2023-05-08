import { FilterOptions, Package } from "@lerna/core";
import { ExecOptions } from "child_process";
import log from "npmlog";
import { collectUpdates } from "./collect-updates";
import { filterPackages } from "./filter-packages";
import { PackageGraph } from "./package-graph";
/**
 * Retrieve a list of Package instances filtered by various options.
 */
export function getFilteredPackages(
  packageGraph: PackageGraph,
  execOpts: ExecOptions,
  opts: Partial<FilterOptions>
): Promise<Package[]> {
  const options = { log, ...opts };

  if (options.scope) {
    options.log.notice("filter", "including %j", options.scope);
  }

  if (options.ignore) {
    options.log.notice("filter", "excluding %j", options.ignore);
  }

  let chain = Promise.resolve();

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then(() =>
    filterPackages(
      packageGraph.rawPackageList,
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      options.scope,
      options.ignore,
      options.private,
      options.continueIfNoMatch
    )
  );

  if (options.since !== undefined) {
    options.log.notice("filter", "changed since %j", options.since);

    if (options.excludeDependents) {
      options.log.notice("filter", "excluding dependents");
    }

    if (options.includeMergedTags) {
      options.log.notice("filter", "including merged tags");
    }

    chain = chain.then((/** @type {ReturnType<typeof filterPackages>} */ filteredPackages) =>
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Promise.resolve(collectUpdates(filteredPackages, packageGraph, execOpts, opts)).then((updates) => {
        const updated = new Set(updates.map(({ pkg }) => pkg.name));

        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return filteredPackages.filter((pkg) => updated.has(pkg.name));
      })
    );
  }

  if (options.includeDependents) {
    options.log.notice("filter", "including dependents");

    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chain = chain.then((filteredPackages) => packageGraph.addDependents(filteredPackages));
  }

  if (options.includeDependencies) {
    options.log.notice("filter", "including dependencies");

    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chain = chain.then((filteredPackages) => packageGraph.addDependencies(filteredPackages));
  }

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return chain;
}
