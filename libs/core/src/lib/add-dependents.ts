import { flatten } from "es-toolkit/compat";
import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "./project-graph-with-packages";

export function addDependents(
  projects: ProjectGraphProjectNodeWithPackage[],
  projectGraph: ProjectGraphWithPackages
): ProjectGraphProjectNodeWithPackage[] {
  const projectsLookup = new Set(projects.map((p) => p.name));
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

  projects.forEach((currentNode) => {
    if (dependents[currentNode.name] && dependents[currentNode.name].length === 0) {
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

        if (dep === currentNode.name || projectsLookup.has(dep)) {
          // a direct or transitive cycle, skip it
          return;
        }

        const dependentNode = projectGraph.nodes[dep];
        collected.add(dependentNode);
        queue.push(dependentNode);
      });
    }
  });

  return Array.from(new Set([...projects, ...collected]));
}
