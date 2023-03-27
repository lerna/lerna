import { ProjectGraph } from "@nrwl/devkit";
import { flatten } from "lodash";

export function addDependents<U extends ProjectGraph, T extends U["nodes"][keyof U["nodes"]]>(
  projects: T[],
  projectGraph: U
): T[] {
  const projectsLookup = new Set(projects.map((p) => p.name));
  const dependents: Record<string, string[]> = flatten(Object.values(projectGraph.dependencies)).reduce(
    (prev, next) => ({
      ...prev,
      [next.target]: [...(prev[next.target] || []), next.source],
    }),
    {} as Record<string, string[]>
  );

  const collected = new Set<T>();

  projects.forEach((currentNode) => {
    if (dependents[currentNode.name] && dependents[currentNode.name].length === 0) {
      return;
    }

    // breadth-first search
    const queue = [currentNode];
    const seen = new Set<string>();

    while (queue.length) {
      const node = queue.shift() as T;

      dependents[node.name]?.forEach((dep) => {
        if (seen.has(dep)) {
          return;
        }
        seen.add(dep);

        if (dep === currentNode.name || projectsLookup.has(dep)) {
          // a direct or transitive cycle, skip it
          return;
        }

        // It's fine to cast here because we know that the project graph consists of nodes of a uniform structure
        const dependentNode = projectGraph.nodes[dep] as T;
        collected.add(dependentNode);
        queue.push(dependentNode);
      });
    }
  });

  return [...projects, ...collected];
}
