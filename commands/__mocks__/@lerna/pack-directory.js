"use strict";

const registry = new Set();

const mockPackDirectory = jest.fn((pkg) => {
  registry.add(pkg.name);

  return Promise.resolve(Buffer.from("MOCK"));
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports.packDirectory = mockPackDirectory;
module.exports.packDirectory.registry = registry;
