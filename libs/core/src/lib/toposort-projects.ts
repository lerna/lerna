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

  const cycles = new Set(mergeOverlappingCycles(unmergedCycles));

  const seen: Set<string> = new Set();

  const queueNextPackages = () => {
    if (seen.size === projects.length) {
      return;
    }

    let batch = Object.keys(dependenciesBySource)
      .filter((p) => dependenciesBySource[p].size === 0)
      .filter((p) => !seen.has(p));

    if (batch.length === 0) {
      const cycle = Array.from(cycles.values()).find((cycle) => {
        // only process the cycle if it has NO nodes with dependencies outside this same cycle
        const cycleHasExternalDependencies = cycle.some((project) => {
          const projectDeps = dependenciesBySource[project];
          const depIsNotInCycle = (dep: string) => cycle.indexOf(dep) === -1;
          return Array.from(projectDeps).filter(depIsNotInCycle).length > 0;
        });
        return !cycleHasExternalDependencies;
      });

      if (cycle) {
        cycles.delete(cycle);
        batch = cycle.filter((p) => projectsMap.has(p));
      }
    }

    batch.forEach((p) => {
      seen.add(p);

      delete dependenciesBySource[p];

      Object.keys(dependenciesBySource).forEach((dep) => dependenciesBySource[dep].delete(p));
    });

    // since the sort is synchronous, we can queue up the next packages
    // after processing the whole batch instead of after each individual
    // project (like in runProjectsTopologically())
    queueNextPackages();
  };

  queueNextPackages();

  return Array.from(seen).map((p) => getProject(p));
}
