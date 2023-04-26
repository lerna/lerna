import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "./project-graph-with-packages";

export function addDependencies(
  projects: ProjectGraphProjectNodeWithPackage[],
  projectGraph: ProjectGraphWithPackages
): ProjectGraphProjectNodeWithPackage[] {
  const projectsLookup = new Set(projects.map((p) => p.name));
  const dependencies = projectGraph.localPackageDependencies;
  const collected = new Set<ProjectGraphProjectNodeWithPackage>();

  projects.forEach((currentNode) => {
    if (dependencies[currentNode.name] && dependencies[currentNode.name].length === 0) {
      return;
    }

    // breadth-first search
    const queue = [currentNode];
    const seen = new Set<string>();

    while (queue.length) {
      const node = queue.shift() as ProjectGraphProjectNodeWithPackage;

      dependencies[node.name]?.forEach(({ target }) => {
        if (seen.has(target)) {
          return;
        }
        seen.add(target);

        if (target === currentNode.name || projectsLookup.has(target)) {
          // a direct or transitive cycle, skip it
          return;
        }

        const dependencyNode = projectGraph.nodes[target];
        collected.add(dependencyNode);
        queue.push(dependencyNode);
      });
    }
  });

  return Array.from(new Set([...projects, ...collected]));
}
