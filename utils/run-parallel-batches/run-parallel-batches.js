"use strict";

const pMap = require("p-map");
const pMapSeries = require("p-map-series");

module.exports = runParallelBatches;

function runParallelBatches(batches, concurrency, mapper) {
  return pMapSeries(batches, batch => pMap(batch, mapper, { concurrency }));
}
