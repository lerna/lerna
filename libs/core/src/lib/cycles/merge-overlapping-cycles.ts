/**
 * Returns an array of elements that are present in both input arrays
 */
function intersection<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.filter((item) => arr2.includes(item));
}

/**
 * Returns an array of elements from the first array that are not present in the second array
 */
function difference<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.filter((item) => !arr2.includes(item));
}

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
