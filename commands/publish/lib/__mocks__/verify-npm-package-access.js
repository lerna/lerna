"use strict";

const registry = new Map();

// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
const mockVerifyNpmPackageAccess = jest.fn((packages, location, npmConfig) => {
  const result = new Set(packages.map(pkg => pkg.name));

  result.add(`registry: ${npmConfig.registry || "default"}`);

  registry.set(location, result);

  return Promise.resolve();
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports = mockVerifyNpmPackageAccess;
module.exports.registry = registry;
