import log from "npmlog";
import { describeRefSync } from "../describe-ref";
import { Package } from "../package";
import { PackageGraph } from "../package-graph";
import { collectPackages } from "./collect-packages";
import { getPackagesForOption } from "./get-packages-for-option";
import { hasTags } from "./has-tags";
import { makeDiffPredicate } from "./make-diff-predicate";

export { collectPackages, getPackagesForOption };

interface UpdateCollectorOptions {
  // The semver bump keyword (patch/minor/major) or explicit version used
  bump?: string;
  // Whether or not to use a "nightly" range (`ref^..ref`) for commits
  canary?: boolean;
  // A list of globs that match files/directories whose changes should not be considered when identifying changed packages
  ignoreChanges?: string[];
  // Whether or not to include the --first-parent flag when calling `git describe` (awkwardly, pass `true` to _omit_ the flag, the default is to include it)
  includeMergedTags?: boolean;
  // Which packages, if any, to always include. Force all packages to be versioned with `true`, or pass a list of globs that match package names
  forcePublish?: boolean | string[];
  // Ref to use when querying git, defaults to most recent annotated tag
  since?: string;
  conventionalCommits?: boolean;
  conventionalGraduate?: boolean;
  excludeDependents?: boolean;
}

/**
 * Create a list of graph nodes representing packages changed since the previous release, tagged or otherwise.
 */
export function collectUpdates(
  filteredPackages: Package[],
  packageGraph: PackageGraph,
  execOpts: /* Should be type import("@lerna/child-process").ExecOpts */ any,
  commandOptions: UpdateCollectorOptions
) {
  const { forcePublish, conventionalCommits, conventionalGraduate, excludeDependents } = commandOptions;

  // If --conventional-commits and --conventional-graduate are both set, ignore --force-publish
  const useConventionalGraduate = conventionalCommits && conventionalGraduate;
  const forced = getPackagesForOption(useConventionalGraduate ? conventionalGraduate : forcePublish);

  const packages =
    filteredPackages.length === packageGraph.size
      ? packageGraph
      : new Map(filteredPackages.map(({ name }) => [name, packageGraph.get(name)]));

  let committish = commandOptions.since;

  if (hasTags(execOpts)) {
    // describe the last annotated tag in the current branch
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { sha, refCount, lastTagName } = describeRefSync(execOpts, commandOptions.includeMergedTags);
    // TODO: warn about dirty tree?

    if (refCount === "0" && forced.size === 0 && !committish) {
      // no commits since previous release
      log.notice("", "Current HEAD is already released, skipping change detection.");

      return [];
    }

    if (commandOptions.canary) {
      // if it's a merge commit, it will return all the commits that were part of the merge
      // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
      committish = `${sha}^..${sha}`;
    } else if (!committish) {
      // if no tags found, this will be undefined and we'll use the initial commit
      committish = lastTagName;
    }
  }

  if (forced.size) {
    // "warn" might seem a bit loud, but it is appropriate for logging anything _forced_
    log.warn(
      useConventionalGraduate ? "conventional-graduate" : "force-publish",
      forced.has("*") ? "all packages" : Array.from(forced.values()).join("\n")
    );
  }

  if (useConventionalGraduate) {
    // --conventional-commits --conventional-graduate
    if (forced.has("*")) {
      log.info("", "Graduating all prereleased packages");
    } else {
      log.info("", "Graduating prereleased packages");
    }
  } else if (!committish || forced.has("*")) {
    // --force-publish or no tag
    log.info("", "Assuming all packages changed");

    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return collectPackages(packages, {
      onInclude: (name) => log.verbose("updated", name),
      excludeDependents,
    });
  }

  log.info("", `Looking for changed packages since ${committish}`);

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const hasDiff = makeDiffPredicate(committish, execOpts, commandOptions.ignoreChanges);
  const needsBump =
    !commandOptions.bump || commandOptions.bump.startsWith("pre")
      ? () => false
      : /* skip packages that have not been previously prereleased */
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (node) => node.prereleaseId;
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const isForced = (node, name) =>
    (forced.has("*") || forced.has(name)) && (useConventionalGraduate ? node.prereleaseId : true);

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return collectPackages(packages, {
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    isCandidate: (node, name) => isForced(node, name) || needsBump(node) || hasDiff(node),
    onInclude: (name) => log.verbose("updated", name),
    excludeDependents,
  });
}
