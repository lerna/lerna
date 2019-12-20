"use strict";

const PQueue = require("p-queue");
const figgyPudding = require("figgy-pudding");
const QueryGraph = require("@lerna/query-graph");

module.exports = runTopologically;

const TopologicalConfig = figgyPudding({
  // p-queue options
  concurrency: {},
  // query-graph options
  "graph-type": {},
  graphType: "graph-type",
  "reject-cycles": {},
  rejectCycles: "reject-cycles",
});

/**
 * Run callback in maximally-saturated topological order.
 *
 * @param {Array<Package>} packages List of `Package` instances
 * @param {Function} runner Callback to map each `Package` with
 * @param {Number} [opts.concurrency] Concurrency of execution
 * @param {String} [opts.graphType] "allDependencies" or "dependencies"
 * @param {Boolean} [opts.rejectCycles] Whether or not to reject cycles
 * @returns {Promise<Array<*>>} when all executions complete
 */
function runTopologically(packages, runner, opts) {
  const { concurrency, graphType, rejectCycles } = TopologicalConfig(opts);

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
              .then(value => returnValues.push(value))
              .then(() => graph.markAsDone(pkg))
              .then(() => queueNextAvailablePackages())
          )
          .catch(reject);
      });

    queueNextAvailablePackages();

    return queue.onIdle().then(() => resolve(returnValues));
  });
}
