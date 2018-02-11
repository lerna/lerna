"use strict";

const async = require("async");

module.exports = runParallelBatches;

function runParallelBatches(batches, makeTask, concurrency, callback) {
  async.series(
    batches.map(batch => cb => {
      async.parallelLimit(batch.map(makeTask), concurrency, cb);
    }),
    callback
  );
}
