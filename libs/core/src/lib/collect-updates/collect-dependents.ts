import { PackageGraphNode } from "../package-graph/package-graph-node";

type LocalDependentVisitor = (
  dependentNode: PackageGraphNode,
  dependentName: string,
  siblingDependents: Map<string, PackageGraphNode>
) => void;

/**
 * Build a set of nodes that are dependents of the input set.
 */
export function collectDependents(nodes: Set<PackageGraphNode>) {
  const collected = new Set<PackageGraphNode>();

  nodes.forEach((currentNode) => {
    if (currentNode.localDependents.size === 0) {
      // no point diving into a non-existent tree
      return;
    }

    // breadth-first search
    const queue = [currentNode];
    const seen = new Set();

    const visit: LocalDependentVisitor = (dependentNode, dependentName, siblingDependents) => {
      if (seen.has(dependentNode)) {
        return;
      }

      seen.add(dependentNode);

      if (dependentNode === currentNode || siblingDependents.has(currentNode.name)) {
        // a direct or transitive cycle, skip it
        return;
      }

      collected.add(dependentNode);
      queue.push(dependentNode);
    };

    while (queue.length) {
      const node = queue.shift();

      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      node.localDependents.forEach(visit);
    }
  });

  return collected;
}
