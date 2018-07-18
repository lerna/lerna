"use strict";

const registry = new Map();

// by default, act like a spy that populates registry
const mockNpmPublish = jest.fn((pkg, tag) => {
  registry.set(pkg.name, tag);

  return Promise.resolve();
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports = mockNpmPublish;
module.exports.registry = registry;
