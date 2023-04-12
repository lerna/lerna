import { ProjectGraphDependency, ProjectGraphProjectNode } from "@nrwl/devkit";
import { flatten } from "lodash";
import { getCycles, mergeOverlappingCycles, reportCycles } from "./cycles";

export function toposortProjects<T extends ProjectGraphProjectNode>(
  projects: T[],
  projectGraphDependencies: Record<string, ProjectGraphDependency[]>,
  rejectCycles = false
): T[] {
  const projectsMap = new Map(projects.map((p) => [p.name, p]));
  const localDependencies = getLocalDependencies(projectGraphDependencies, projectsMap);
  const flattenedLocalDependencies = flatten(Object.values(localDependencies));

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

  flattenedLocalDependencies.forEach((dep) => {
    if (dependenciesBySource[dep.source]) dependenciesBySource[dep.source].add(dep.target);
  });

  const unmergedCycles = getCycles(localDependencies);

  reportCycles(unmergedCycles, rejectCycles);

  const cycles = mergeOverlappingCycles(unmergedCycles);

  const sorted: T[] = [];
  while (sorted.length < projects.length) {
    let batch = Object.keys(dependenciesBySource).filter((p) => dependenciesBySource[p].size === 0);

    if (batch.length === 0) {
      // no other leaf nodes found, so process the first cycle
      batch = cycles.shift() || [];
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

/**
 * Get only dependencies between local projects.
 * @param projectGraphDependencies all project graph dependencies
 * @param projectsMap a map of projects to filter dependencies by
 * @returns all project dependencies between projects in the projectsMap
 */
export function getLocalDependencies(
  projectGraphDependencies: Record<string, ProjectGraphDependency[]>,
  projectsMap: Map<string, ProjectGraphProjectNode>
): Record<string, ProjectGraphDependency[]> {
  const localDependencies: Record<string, ProjectGraphDependency[]> = {};
  Object.entries(projectGraphDependencies).forEach(([project, deps]) => {
    if (projectsMap.has(project)) {
      localDependencies[project] = deps.filter((dep) => projectsMap.has(dep.target));
    }
  });
  return localDependencies;
}
