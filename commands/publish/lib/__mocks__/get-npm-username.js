"use strict";

const registry = new Map();

// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
const mockGetNpmUsername = jest.fn(opts => {
  registry.set(opts.prefix, opts);

  return Promise.resolve("lerna-test");
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports = mockGetNpmUsername;
module.exports.registry = registry;
