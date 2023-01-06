import { PackageGraphNode } from "./package-graph-node";

let lastCollapsedNodeId = 0;

/**
 * Represents a cyclic collection of nodes in a PackageGraph.
 * It is meant to be used as a black box, where the only exposed
 * information are the connections to the other nodes of the graph.
 * It can contain either `PackageGraphNode`s or other `CyclicPackageGraphNode`s.
 */
export class CyclicPackageGraphNode extends Map<string, PackageGraphNode | CyclicPackageGraphNode> {
  name: string;
  localDependencies: Map<string, PackageGraphNode | CyclicPackageGraphNode>;
  localDependents: Map<string, PackageGraphNode | CyclicPackageGraphNode>;

  constructor() {
    super();
    this.name = `(cycle) ${(lastCollapsedNodeId += 1)}`;
    this.localDependencies = new Map();
    this.localDependents = new Map();
  }

  // eslint-disable-next-line class-methods-use-this
  get isCycle() {
    return true;
  }

  /**
   * @returns A representation of a cycle, like like `A -> B -> C -> A`.
   */
  override toString(): string {
    const parts = Array.from(this, ([key, node]) =>
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      node.isCycle ? `(nested cycle: ${node.toString()})` : key
    );

    // start from the origin
    parts.push(parts[0]);

    return parts.reverse().join(" -> ");
  }

  /**
   * Flattens a CyclicPackageGraphNode (which can have multiple level of cycles).
   */
  flatten() {
    const result: PackageGraphNode[] = [];

    for (const node of this.values()) {
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (node.isCycle) {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        result.push(...node.flatten());
      } else {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        result.push(node);
      }
    }

    return result;
  }

  /**
   * Checks if a given node is contained in this cycle (or in a nested one)
   *
   * @param name The name of the package to search in this cycle
   */
  contains(name: string): boolean {
    for (const [currentName, currentNode] of this) {
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (currentNode.isCycle) {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (currentNode.contains(name)) {
          return true;
        }
      } else if (currentName === name) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adds a graph node, or a nested cycle, to this group.
   */
  insert(node: PackageGraphNode | CyclicPackageGraphNode) {
    this.set(node.name, node);
    this.unlink(node);

    for (const [dependencyName, dependencyNode] of node.localDependencies) {
      if (!this.contains(dependencyName)) {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.localDependencies.set(dependencyName, dependencyNode);
      }
    }

    for (const [dependentName, dependentNode] of node.localDependents) {
      if (!this.contains(dependentName)) {
        this.localDependents.set(dependentName, dependentNode);
      }
    }
  }

  /**
   * Remove pointers to candidate node from internal collections.
   * @param candidateNode instance to unlink
   */
  unlink(candidateNode: PackageGraphNode | CyclicPackageGraphNode) {
    // remove incoming edges ("indegree")
    this.localDependencies.delete(candidateNode.name);

    // remove outgoing edges ("outdegree")
    this.localDependents.delete(candidateNode.name);
  }
}
