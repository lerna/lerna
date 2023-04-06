import { ProjectGraphDependency } from "@nrwl/devkit";

/**
 * Get all cycles within the given dependencies.
 * @param dependencies project dependencies grouped by source
 * @returns a list of cycles, where each cycle is a list of project names
 */
export function getCycles(dependencies: Record<string, ProjectGraphDependency[]>): string[][] {
  const cycles: string[][] = [];
  const visited: Set<string> = new Set();

  function dfs(next: string, path: string[]) {
    visited.add(next);
    path.push(next);

    for (const dep of dependencies[next] || []) {
      if (path.includes(dep.target)) {
        const cycle = path.slice(path.indexOf(dep.target));
        cycles.push(cycle);
      } else if (!visited.has(dep.target)) {
        dfs(dep.target, path);
      }
    }

    path.pop();
  }

  for (const next of Object.keys(dependencies)) {
    if (!visited.has(next)) {
      dfs(next, []);
    }
  }

  return cycles;
}
