import { ProjectGraphDependency, ProjectGraphProjectNode } from "@nrwl/devkit";
import { flatten } from "lodash";

export function toposortProjects<T extends ProjectGraphProjectNode>(
  projects: T[],
  projectGraphDependencies: Record<string, ProjectGraphDependency[]>
): T[] {
  const allDependencies = flatten(Object.values(projectGraphDependencies));
  const projectsMap = new Map(projects.map((p) => [p.name, p]));

  const getProject = (name: string) => {
    const project = projectsMap.get(name);
    if (!project) {
      throw new Error(`Failed to find project ${name}. This is likely a bug in Lerna's toposort algorithm.`);
    }
    return project;
  };

  const dependenciesBySource: Record<string, Set<string>> = projects.reduce(
    (prev, next) => ({
      ...prev,
      [next.name]: new Set<string>(),
    }),
    {}
  );

  allDependencies.forEach((dep) => {
    if (dependenciesBySource[dep.source] && projectsMap.has(dep.target))
      dependenciesBySource[dep.source].add(dep.target);
  });

  const sorted: T[] = [];
  while (Object.keys(dependenciesBySource).length > 0) {
    let batch = Object.keys(dependenciesBySource).filter((p) => dependenciesBySource[p].size === 0);

    if (batch.length === 0) {
      // cycle detected, so just pick one to start
      batch = [Object.keys(dependenciesBySource)[0]];
    }

    batch.forEach((p) => {
      sorted.push(getProject(p));
      delete dependenciesBySource[p];
    });

    Object.keys(dependenciesBySource).forEach((p) => {
      batch.forEach((b) => dependenciesBySource[p].delete(b));
    });
  }

  return sorted;
}
