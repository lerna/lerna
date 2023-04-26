import { flatten } from "lodash";
import { getCycles, mergeOverlappingCycles, reportCycles } from "./cycles";
import { ProjectGraphProjectNodeWithPackage, ProjectGraphWithPackages } from "./project-graph-with-packages";

export function toposortProjects(
  projects: ProjectGraphProjectNodeWithPackage[],
  projectGraph: ProjectGraphWithPackages,
  rejectCycles = false
): ProjectGraphProjectNodeWithPackage[] {
  const projectsMap = new Map(projects.map((p) => [p.name, p]));
  const localDependencies = projectGraph.localPackageDependencies;
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
    if (dependenciesBySource[dep.source] && projectsMap.has(dep.target)) {
      dependenciesBySource[dep.source].add(dep.target);
    }
  });

  const unmergedCycles = getCycles(localDependencies);

  reportCycles(unmergedCycles, rejectCycles);

  const cycles = mergeOverlappingCycles(unmergedCycles);

  const sorted: ProjectGraphProjectNodeWithPackage[] = [];
  while (sorted.length < projects.length) {
    let batch = Object.keys(dependenciesBySource).filter((p) => dependenciesBySource[p].size === 0);

    if (batch.length === 0) {
      // no other leaf nodes found, so process the first cycle
      batch = cycles.shift() || [];
      batch = batch.filter((p) => projectsMap.has(p));
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
