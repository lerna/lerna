import { Package } from "./package";
import { PackageGraph } from "./package-graph";
import { CyclicPackageGraphNode } from "./package-graph/cyclic-package-graph-node";
import { PackageGraphNode } from "./package-graph/package-graph-node";

export interface QueryGraphConfig {
  // "dependencies" excludes devDependencies from graph
  graphType?: "allDependencies" | "dependencies";
  // Whether or not to reject dependency cycles
  rejectCycles?: boolean;
}

/**
 * A mutable PackageGraph used to query for next available packages.
 */
export class QueryGraph {
  graph: PackageGraph;
  cycles: Set<CyclicPackageGraphNode>;

  /**
   * Sort a list of Packages topologically.
   * @returns A list of Package instances in topological order
   */
  static toposort(packages: Package[], options?: QueryGraphConfig): Package[] {
    const graph = new QueryGraph(packages, options);
    const result = [];

    let batch = graph.getAvailablePackages();

    while (batch.length) {
      for (const node of batch) {
        // no need to take() in synchronous loop
        result.push(node.pkg);
        graph.markAsDone(node);
      }

      batch = graph.getAvailablePackages();
    }

    return result;
  }

  constructor(packages: Package[], { graphType = "allDependencies", rejectCycles }: QueryGraphConfig = {}) {
    // Create dependency graph
    this.graph = new PackageGraph(packages, graphType);

    // Evaluate cycles
    this.cycles = this.graph.collapseCycles(rejectCycles);
  }

  _getNextLeaf() {
    return Array.from(this.graph.values()).filter((node) => node.localDependencies.size === 0);
  }

  _getNextCycle() {
    const cycle = Array.from(this.cycles).find((cycleNode) => cycleNode.localDependencies.size === 0);

    if (!cycle) {
      return [];
    }

    this.cycles.delete(cycle);

    return cycle.flatten();
  }

  getAvailablePackages() {
    // Get the next leaf nodes
    const availablePackages = this._getNextLeaf();

    if (availablePackages.length > 0) {
      return availablePackages;
    }

    return this._getNextCycle();
  }

  markAsTaken(name: string) {
    this.graph.delete(name);
  }

  markAsDone(candidateNode: PackageGraphNode) {
    this.graph.remove(candidateNode);

    for (const cycle of this.cycles) {
      cycle.unlink(candidateNode);
    }
  }
}

export const toposort = QueryGraph.toposort;
