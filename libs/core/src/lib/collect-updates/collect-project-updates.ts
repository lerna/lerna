import { ExecOptions } from "child_process";
import { flatten } from "lodash";
import log from "npmlog";
import { describeRefSync } from "../describe-ref";
import { getPackagesForOption } from "../get-packages-for-option";
import { prereleaseIdFromVersion } from "../prerelease-id-from-version";
import {
  getPackage,
  ProjectGraphProjectNodeWithPackage,
  ProjectGraphWithPackages,
} from "../project-graph-with-packages";
import { hasTags } from "./has-tags";
import { makeDiffPredicate } from "./make-diff-predicate";

export interface ProjectUpdateCollectorOptions {
  // The semver bump keyword (patch/minor/major) or explicit version used
  bump?: string;
  // Whether or not to use a "nightly" range (`ref^..ref`) for commits
  canary?: boolean;
  // A list of globs that match files/directories whose changes should not be considered when identifying changed packages
  ignoreChanges?: string[];
  // Whether or not to include the --first-parent flag when calling `git describe` (awkwardly, pass `true` to _omit_ the flag, the default is to include it)
  includeMergedTags?: boolean;
  // Which packages, if any, to always include. Force all packages to be versioned with `true`, or pass a list of globs that match package names
  forcePublish?: boolean | string | string[];
  // Ref to use when querying git, defaults to most recent annotated tag
  since?: string;
  conventionalCommits?: boolean;
  conventionalGraduate?: string | boolean;
  forceConventionalGraduate?: boolean;
  excludeDependents?: boolean;
}

/**
 * Create a list of graph nodes representing projects changed since the previous release, tagged or otherwise.
 */
export function collectProjectUpdates(
  filteredProjects: ProjectGraphProjectNodeWithPackage[],
  projectGraph: ProjectGraphWithPackages,
  execOpts: ExecOptions,
  commandOptions: ProjectUpdateCollectorOptions
): ProjectGraphProjectNodeWithPackage[] {
  const {
    forcePublish,
    conventionalCommits,
    forceConventionalGraduate,
    conventionalGraduate,
    excludeDependents,
  } = commandOptions;

  // If --conventional-commits and --conventional-graduate are both set, ignore --force-publish but consider --force-conventional-graduate
  const useConventionalGraduate = conventionalCommits && (conventionalGraduate || forceConventionalGraduate);
  const forced = getPackagesForOption(useConventionalGraduate ? conventionalGraduate : forcePublish);

  let committish = commandOptions.since ?? "";

  if (hasTags(execOpts)) {
    // describe the last annotated tag in the current branch
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { sha, refCount, lastTagName } = describeRefSync(execOpts, commandOptions.includeMergedTags);

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

    return collectProjects(filteredProjects, projectGraph, {
      onInclude: (name) => log.verbose("updated", name),
      excludeDependents,
    });
  }

  log.info("", `Looking for changed packages since ${committish}`);

  const hasDiff = makeDiffPredicate(committish, execOpts, commandOptions.ignoreChanges);
  const needsBump =
    !commandOptions.bump || commandOptions.bump.startsWith("pre")
      ? () => false
      : /* skip packages that have not been previously prereleased */
        (node: ProjectGraphProjectNodeWithPackage) => !!prereleaseIdFromVersion(getPackage(node).version);
  const isForced = (node: ProjectGraphProjectNodeWithPackage, name: string) =>
    !!(
      (forced.has("*") || forced.has(name)) &&
      ((useConventionalGraduate ? prereleaseIdFromVersion(getPackage(node).version) : true) ||
        forceConventionalGraduate)
    );

  return collectProjects(filteredProjects, projectGraph, {
    isCandidate: (node: ProjectGraphProjectNodeWithPackage, name: string) =>
      isForced(node, name) || needsBump(node) || hasDiff(node),
    onInclude: (name: string) => log.verbose("updated", name),
    excludeDependents,
  });
}

export interface ProjectCollectorOptions {
  // By default, all nodes passed in are candidates
  isCandidate?: (node: ProjectGraphProjectNodeWithPackage, packageName: string) => boolean;
  onInclude?: (packageName: string) => void;
  excludeDependents?: boolean;
}

export function collectProjects(
  projects: ProjectGraphProjectNodeWithPackage[],
  projectGraph: ProjectGraphWithPackages,
  { isCandidate = () => true, onInclude, excludeDependents }: ProjectCollectorOptions = {}
): ProjectGraphProjectNodeWithPackage[] {
  const candidates: Record<string, ProjectGraphProjectNodeWithPackage> = {};

  projects.forEach((node) => {
    if (isCandidate(node, getPackage(node).name)) {
      candidates[node.name] = node;
    }
  });

  if (!excludeDependents) {
    collectDependents(candidates, projectGraph).forEach((node) => (candidates[node.name] = node));
  }

  // The result should always be in the same order as the input
  const updates: ProjectGraphProjectNodeWithPackage[] = [];

  projects.forEach((node) => {
    if (candidates[node.name]) {
      if (onInclude) {
        onInclude(getPackage(node).name);
      }
      updates.push(node);
    }
  });

  return updates;
}

/**
 * Build a set of nodes that are dependents of the input set.
 */
export function collectDependents(
  nodes: Record<string, ProjectGraphProjectNodeWithPackage>,
  projectGraph: ProjectGraphWithPackages
): Set<ProjectGraphProjectNodeWithPackage> {
  const dependents: Record<string, string[]> = flatten(
    Object.values(projectGraph.localPackageDependencies)
  ).reduce(
    (prev, next) => ({
      ...prev,
      [next.target]: [...(prev[next.target] || []), next.source],
    }),
    {} as Record<string, string[]>
  );

  const collected = new Set<ProjectGraphProjectNodeWithPackage>();

  Object.values(nodes).forEach((currentNode) => {
    if (dependents[currentNode.name] && dependents[currentNode.name].length === 0) {
      // no point diving into a non-existent tree
      return;
    }

    // breadth-first search
    const queue = [currentNode];
    const seen = new Set<string>();

    while (queue.length) {
      const node = queue.shift() as ProjectGraphProjectNodeWithPackage;

      dependents[node.name]?.forEach((dep) => {
        if (seen.has(dep)) {
          return;
        }
        seen.add(dep);

        if (dep === currentNode.name || nodes[dep]) {
          // a direct or transitive cycle, skip it
          return;
        }

        const dependentNode = projectGraph.nodes[dep];
        collected.add(dependentNode);
        queue.push(dependentNode);
      });
    }
  });

  return collected;
}
