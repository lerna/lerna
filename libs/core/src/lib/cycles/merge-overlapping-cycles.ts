import { difference, intersection } from "es-toolkit/compat";

/**
 * Merges all cycles that share nodes into a single cycle, then returns all merged cycles. This allows all cycle nodes to be traversed without repeating any nodes.
 * @param cycles a list of cycles, with each cycle being a list of project names
 * @returns a list of cycles that do not share any nodes with any other cycles
 */
export function mergeOverlappingCycles(cycles: string[][]): string[][] {
  const mergedCycles: string[][] = [];
  cycles.forEach((cycle) => {
    let intersectionNodes: string[] = [];
    const mergedCycle = mergedCycles.find((mergedCycle) => {
      intersectionNodes = intersection(mergedCycle, cycle);
      return intersectionNodes.length > 0;
    });

    if (mergedCycle) {
      mergedCycle.push(...difference(cycle, intersectionNodes));
    } else {
      mergedCycles.push(cycle);
    }
  });
  return mergedCycles;
}
