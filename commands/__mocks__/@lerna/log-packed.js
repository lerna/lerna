"use strict";

const registry = new Set();

const mockLogPacked = jest.fn((contents) => {
  registry.add(contents.name);
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports.logPacked = mockLogPacked;
module.exports.logPacked.registry = registry;
