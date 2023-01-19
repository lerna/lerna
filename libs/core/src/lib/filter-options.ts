import dedent from "dedent";
import log from "npmlog";
import { Argv } from "yargs";
import { collectUpdates } from "./collect-updates";
import { filterPackages } from "./filter-packages";
import { Package } from "./package";
import { PackageGraph } from "./package-graph";

export function filterOptions(yargs: Argv) {
  // Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands
  const opts = {
    scope: {
      describe: "Include only packages with names matching the given glob.",
      type: "string",
      requiresArg: true,
    },
    ignore: {
      describe: "Exclude packages with names matching the given glob.",
      type: "string",
      requiresArg: true,
    },
    "no-private": {
      describe: 'Exclude packages with { "private": true } in their package.json.',
      type: "boolean",
    },
    private: {
      // proxy for --no-private
      hidden: true,
      type: "boolean",
    },
    since: {
      describe: dedent`
        Only include packages that have been changed since the specified [ref].
        If no ref is passed, it defaults to the most-recent tag.
      `,
      type: "string",
    },
    "exclude-dependents": {
      describe: dedent`
        Exclude all transitive dependents when running a command
        with --since, overriding the default "changed" algorithm.
      `,
      conflicts: "include-dependents",
      type: "boolean",
    },
    "include-dependents": {
      describe: dedent`
        Include all transitive dependents when running a command
        regardless of --scope, --ignore, or --since.
      `,
      conflicts: "exclude-dependents",
      type: "boolean",
    },
    "include-dependencies": {
      describe: dedent`
        Include all transitive dependencies when running a command
        regardless of --scope, --ignore, or --since.
      `,
      type: "boolean",
    },
    "include-merged-tags": {
      describe: "Include tags from merged branches when running a command with --since.",
      type: "boolean",
    },
    "continue-if-no-match": {
      describe: "Don't fail if no package is matched",
      hidden: true,
      type: "boolean",
    },
  };

  return (
    yargs
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .options(opts)
      .group(Object.keys(opts), "Filter Options:")
      .option("include-filtered-dependents", {
        // TODO: remove in next major release
        hidden: true,
        conflicts: ["exclude-dependents", "include-dependents"],
        type: "boolean",
      })
      .option("include-filtered-dependencies", {
        // TODO: remove in next major release
        hidden: true,
        conflicts: "include-dependencies",
        type: "boolean",
      })
      .check((argv) => {
        /* eslint-disable no-param-reassign */
        if (argv["includeFilteredDependents"]) {
          argv["includeDependents"] = true;
          argv["include-dependents"] = true;
          delete argv["includeFilteredDependents"];
          delete argv["include-filtered-dependents"];
          log.warn("deprecated", "--include-filtered-dependents has been renamed --include-dependents");
        }

        if (argv["includeFilteredDependencies"]) {
          argv["includeDependencies"] = true;
          argv["include-dependencies"] = true;
          delete argv["includeFilteredDependencies"];
          delete argv["include-filtered-dependencies"];
          log.warn("deprecated", "--include-filtered-dependencies has been renamed --include-dependencies");
        }
        /* eslint-enable no-param-reassign */

        return argv;
      })
  );
}

interface FilterOptions {
  scope: string;
  ignore: string;
  private: boolean;
  since: string;
  continueIfNoMatch: boolean;
  excludeDependents: boolean;
  includeDependents: boolean;
  includeDependencies: boolean;
  includeMergedTags: boolean;
  log: typeof log;
}

/**
 * Retrieve a list of Package instances filtered by various options.
 */
export function getFilteredPackages(
  packageGraph: PackageGraph,
  execOpts: /* should be import("@lerna/child-process").ExecOpts */ any,
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
