"use strict";

const PQueue = require("p-queue");
const npmlog = require("npmlog");
const figgyPudding = require("figgy-pudding");
const QueryGraph = require("@lerna/query-graph");
const Profiler = require("./profiler");

module.exports = runTopologically;

const TopologicalConfig = figgyPudding({
  log: { default: npmlog },
  // p-queue options
  concurrency: {},
  // query-graph options
  "graph-type": {},
  graphType: "graph-type",
  "reject-cycles": {},
  rejectCycles: "reject-cycles",
  // profile options
  profile: { default: false },
  "profile-location": {},
  profileLocation: "profile-location",
  "root-path": {},
  rootPath: "root-path",
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
  const { concurrency, graphType, log, profile, profileLocation, rejectCycles, rootPath } = TopologicalConfig(
    opts
  );

  const profiler = new Profiler({ concurrency, log, profile, profileLocation, rootPath });
  const queue = new PQueue({ concurrency });
  const graph = new QueryGraph(packages, { graphType, rejectCycles });

  return new Promise((resolve, reject) => {
    const returnValues = [];

    const queueNextAvailablePackages = () =>
      graph.getAvailablePackages().forEach(({ pkg, name }) => {
        graph.markAsTaken(name);

        queue
          .add(() =>
            profiler
              .run(() => runner(pkg), name)
              .then(value => returnValues.push(value))
              .then(() => graph.markAsDone(pkg))
              .then(() => queueNextAvailablePackages())
          )
          .catch(reject);
      });

    queueNextAvailablePackages();

    return queue
      .onIdle()
      .then(() => profiler.output())
      .then(() => resolve(returnValues));
  });
}
