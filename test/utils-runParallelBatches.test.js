"use strict";

// file under test
const runParallelBatches = require("../src/utils/runParallelBatches");

describe("runParallelBatches", () => {
  // Array#sort sorts numbers lexicographically by default!
  function numericalSort(a, b) {
    return a - b;
  }

  it("should run batches serially", done => {
    const batches = [[1], [2, 3], [4, 5, 6], [7, 8, 9, 10]];

    const taskOrdering = [];

    runParallelBatches(
      batches,
      n => cb => {
        taskOrdering.push(n);
        cb();
      },
      1,
      err => {
        if (err) {
          return done.fail(err);
        }

        try {
          expect(taskOrdering).toHaveLength(10);
          expect([
            taskOrdering.slice(0, 1).sort(numericalSort),
            taskOrdering.slice(1, 3).sort(numericalSort),
            taskOrdering.slice(3, 6).sort(numericalSort),
            taskOrdering.slice(6, 10).sort(numericalSort),
          ]).toEqual(batches);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }
    );
  });
});
