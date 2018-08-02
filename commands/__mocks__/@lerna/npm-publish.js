"use strict";

const packed = new Set();
const registry = new Map();

// by default, act like a spy that populates registry
const mockNpmPublish = jest.fn((pkg, tag) => {
  registry.set(pkg.name, tag);

  return Promise.resolve();
});

const mockNpmPack = jest.fn(pkg => {
  packed.add(pkg.name);

  return Promise.resolve(pkg.tarball);
});

// a convenient format for assertions
function order() {
  return Array.from(registry.keys());
}

// keep test data isolated
afterEach(() => {
  registry.clear();
  packed.clear();
});

module.exports = mockNpmPublish;
module.exports.npmPack = mockNpmPack;
module.exports.order = order;
module.exports.packed = packed;
module.exports.registry = registry;
