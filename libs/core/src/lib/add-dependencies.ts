import { ProjectGraph } from "@nrwl/devkit";
import { mapValues } from "lodash";

export function addDependencies<U extends ProjectGraph, T extends U["nodes"][keyof U["nodes"]]>(
  projects: T[],
  projectGraph: U
): T[] {
  const projectsLookup = new Set(projects.map((p) => p.name));
  const dependencies: Record<string, string[]> = mapValues(projectGraph.dependencies, (deps) =>
    deps.map((dep) => dep.target).filter((dep) => !dep.startsWith("npm:"))
  );
  const collected = new Set<T>();

  projects.forEach((currentNode) => {
    if (dependencies[currentNode.name] && dependencies[currentNode.name].length === 0) {
      return;
    }

    // breadth-first search
    const queue = [currentNode];
    const seen = new Set<string>();

    while (queue.length) {
      const node = queue.shift() as T;

      dependencies[node.name]?.forEach((dep) => {
        if (seen.has(dep)) {
          return;
        }
        seen.add(dep);

        if (dep === currentNode.name || projectsLookup.has(dep)) {
          // a direct or transitive cycle, skip it
          return;
        }

        // It's fine to cast here because we know that the project graph consists of nodes of a uniform structure
        const dependencyNode = projectGraph.nodes[dep] as T;
        collected.add(dependencyNode);
        queue.push(dependencyNode);
      });
    }
  });

  return Array.from(new Set([...projects, ...collected]));
}
