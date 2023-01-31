import PQueue from "p-queue";
import { Package } from "./package";
import { QueryGraph, QueryGraphConfig } from "./query-graph";

interface TopologicalConfig extends QueryGraphConfig {
  concurrency?: number;
}

/**
 * Run callback in maximally-saturated topological order.
 *
 * @template T
 * @param {import("@lerna/package").Package[]} packages List of `Package` instances
 * @param {(pkg: import("@lerna/package").Package) => Promise<T>} runner Callback to map each `Package` with
 * @param {TopologicalConfig} [options]
 * @returns {Promise<T[]>} when all executions complete
 */
export function runTopologically<T>(
  packages: Package[],
  runner: (pkg: Package) => Promise<T>,
  { concurrency, graphType, rejectCycles }: TopologicalConfig = {}
): Promise<T[]> {
  const queue = new PQueue({ concurrency });
  const graph = new QueryGraph(packages, { graphType, rejectCycles });

  return new Promise((resolve, reject) => {
    const returnValues: T[] | PromiseLike<T[]> = [];

    const queueNextAvailablePackages = () =>
      graph.getAvailablePackages().forEach(({ pkg, name }) => {
        graph.markAsTaken(name);

        queue
          .add(() =>
            runner(pkg)
              .then((value) => returnValues.push(value))
              // TODO: refactor based on TS feedback
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              .then(() => graph.markAsDone(pkg))
              .then(() => queueNextAvailablePackages())
          )
          .catch(reject);
      });

    queueNextAvailablePackages();

    queue.onIdle().then(() => resolve(returnValues));
  });
}
