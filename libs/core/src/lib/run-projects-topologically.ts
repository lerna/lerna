import { ProjectGraphDependency, ProjectGraphProjectNode } from "@nrwl/devkit";
import { flatten } from "lodash";
import PQueue from "p-queue";
import { getCycles, mergeOverlappingCycles, reportCycles } from "./cycles";
import { getLocalDependencies } from "./toposort-projects";

interface TopologicalConfig {
  concurrency?: number;
  rejectCycles?: boolean;
}

/**
 * Run callback in maximally-saturated topological order.
 */
export async function runProjectsTopologically<T, U extends ProjectGraphProjectNode>(
  projects: U[],
  projectGraphDependencies: Record<string, ProjectGraphDependency[]>,
  runner: (node: U) => Promise<T>,
  { concurrency, rejectCycles }: TopologicalConfig = {}
): Promise<T[]> {
  const queue = new PQueue({ concurrency });

  const returnValues: T[] = [];

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

  const seen: Set<string> = new Set();

  const queueNextPackages = () => {
    if (seen.size === projects.length) {
      return;
    }
    let batch = Object.keys(dependenciesBySource)
      .filter((p) => dependenciesBySource[p].size === 0)
      .filter((p) => !seen.has(p));

    if (batch.length === 0) {
      const cycle = cycles[0] || [];

      // only process the cycle if it has NO nodes with dependencies outside this same cycle
      const cycleHasExternalDependencies = cycle.some((project) => {
        const projectDeps = dependenciesBySource[project];
        const depIsNotInCycle = (dep: string) => cycle.indexOf(dep) === -1;
        return Array.from(projectDeps).filter(depIsNotInCycle).length > 0;
      });

      if (!cycleHasExternalDependencies) {
        batch = cycles.shift() || [];
      }
    }

    batch.forEach((p) => {
      const project = getProject(p);
      seen.add(p);

      queue.add(() =>
        runner(project).then((value) => {
          returnValues.push(value);

          delete dependenciesBySource[p];

          Object.keys(dependenciesBySource).forEach((dep) => dependenciesBySource[dep].delete(p));

          queueNextPackages();
        })
      );
    });
  };

  queueNextPackages();

  await queue.onIdle();

  return returnValues;
}
