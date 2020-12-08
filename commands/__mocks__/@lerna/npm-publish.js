"use strict";

const registry = new Map();

// by default, act like a spy that populates registry
const mockNpmPublish = jest.fn((pkg, tarData, opts) => {
  registry.set(pkg.name, opts.tag);

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

module.exports.npmPublish = mockNpmPublish;
module.exports.npmPublish.order = order;
module.exports.npmPublish.registry = registry;
