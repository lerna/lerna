"use strict";

const registry = new Map();

// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
const mockVerifyNpmRegistry = jest.fn((location, npmConfig) => {
  registry.set(location, npmConfig.registry || "default registry");

  return Promise.resolve();
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports = mockVerifyNpmRegistry;
module.exports.registry = registry;
