"use strict";

const registry = new Set();

const mockGetPacked = jest.fn((pkg) => {
  registry.add(pkg.name);

  return Promise.resolve({
    name: pkg.name,
  });
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports.getPacked = mockGetPacked;
module.exports.getPacked.registry = registry;
