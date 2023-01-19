import { PackageGraphNode } from "../package-graph/package-graph-node";
import { collectDependents } from "./collect-dependents";

export interface PackageCollectorOptions {
  // By default, all nodes passed in are candidates
  isCandidate?: (node?: PackageGraphNode, name?: string) => boolean;
  onInclude?: (name: string) => void;
  excludeDependents?: boolean;
}

/**
 * Build a list of graph nodes, possibly including dependents, using predicate if available.
 */
export function collectPackages(
  packages: Map<string, PackageGraphNode>,
  { isCandidate = () => true, onInclude, excludeDependents }: PackageCollectorOptions = {}
) {
  const candidates = new Set<PackageGraphNode>();

  packages.forEach((node, name) => {
    if (isCandidate(node, name)) {
      candidates.add(node);
    }
  });

  if (!excludeDependents) {
    collectDependents(candidates).forEach((node) => candidates.add(node));
  }

  // The result should always be in the same order as the input
  const updates: PackageGraphNode[] = [];

  packages.forEach((node, name) => {
    if (candidates.has(node)) {
      if (onInclude) {
        onInclude(name);
      }
      updates.push(node);
    }
  });

  return updates;
}
