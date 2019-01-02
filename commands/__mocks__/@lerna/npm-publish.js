"use strict";

const registry = new Map();

// by default, act like a spy that populates registry
const mockNpmPublish = jest.fn((pkg, tag) => {
  registry.set(pkg.name, tag);

  return Promise.resolve();
});

// a convenient format for assertions
function order() {
  return Array.from(registry.keys());
}

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports = mockNpmPublish;
module.exports.order = order;
module.exports.registry = registry;
