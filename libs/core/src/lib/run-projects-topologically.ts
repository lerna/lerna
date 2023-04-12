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
export function runProjectsTopologically<T, U extends ProjectGraphProjectNode>(
  projects: U[],
  projectGraphDependencies: Record<string, ProjectGraphDependency[]>,
  runner: (node: U) => Promise<T>,
  { concurrency, rejectCycles }: TopologicalConfig = {}
): Promise<T[]> {
  const queue = new PQueue({ concurrency });

  return new Promise((resolve, reject) => {
    const returnValues: T[] | PromiseLike<T[]> = [];

    const projectsMap = new Map(projects.map((p) => [p.name, p]));
    const localDependencies = getLocalDependencies(projectGraphDependencies, projectsMap);
    const flattenedLocalDependencies = flatten(Object.values(localDependencies));

    const getProject = (name: string) => {
      const project = projectsMap.get(name);
      if (!project) {
        throw new Error(
          `Failed to find project ${name}. This is likely a bug in Lerna's toposort algorithm.`
        );
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

    const seen: U[] = [];
    while (seen.length < projects.length) {
      let batch = Object.keys(dependenciesBySource).filter((p) => dependenciesBySource[p].size === 0);

      if (batch.length === 0) {
        // no other leaf nodes found, so process the first cycle
        batch = cycles.shift() || [];
      }

      batch.forEach((p) => {
        const project = getProject(p);
        seen.push(project);
        delete dependenciesBySource[p];

        queue.add(() => runner(project).then((value) => returnValues.push(value))).catch(reject);
      });

      Object.keys(dependenciesBySource).forEach((p) => {
        batch.forEach((b) => dependenciesBySource[p].delete(b));
      });
    }

    queue.onIdle().then(() => resolve(returnValues));
  });
}
