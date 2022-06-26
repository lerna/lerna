"use strict";

const PQueue = require("p-queue").default;
const { QueryGraph } = require("@lerna/query-graph");

module.exports.runTopologically = runTopologically;

/**
 * @typedef {import("@lerna/query-graph").QueryGraphConfig & { concurrency: number }} TopologicalConfig
 */

/**
 * Run callback in maximally-saturated topological order.
 *
 * @template T
 * @param {import("@lerna/package").Package[]} packages List of `Package` instances
 * @param {(pkg: import("@lerna/package").Package) => Promise<T>} runner Callback to map each `Package` with
 * @param {TopologicalConfig} [options]
 * @returns {Promise<T[]>} when all executions complete
 */
function runTopologically(packages, runner, { concurrency, graphType, rejectCycles } = {}) {
  const queue = new PQueue({ concurrency });
  const graph = new QueryGraph(packages, { graphType, rejectCycles });

  return new Promise((resolve, reject) => {
    const returnValues = [];

    const queueNextAvailablePackages = () =>
      graph.getAvailablePackages().forEach(({ pkg, name }) => {
        graph.markAsTaken(name);

        queue
          .add(() =>
            runner(pkg)
              .then((value) => returnValues.push(value))
              .then(() => graph.markAsDone(pkg))
              .then(() => queueNextAvailablePackages())
          )
          .catch(reject);
      });

    queueNextAvailablePackages();

    queue.onIdle().then(() => resolve(returnValues));
  });
}
