"use strict";

const PQueue = require("p-queue");
const figgyPudding = require("figgy-pudding");
const QueryGraph = require("@lerna/query-graph");

module.exports = runTopologically;

const TopologicalConfig = figgyPudding({
  packages: {},
  concurrency: {},
  "reject-cycles": {},
  rejectCycles: "reject-cycles",
  runner: {},
});

function runTopologically(_opts) {
  const opts = TopologicalConfig(_opts);
  const { packages, concurrency, rejectCycles, runner } = opts;

  const queue = new PQueue({ concurrency });
  const graph = new QueryGraph(packages, { rejectCycles });

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
