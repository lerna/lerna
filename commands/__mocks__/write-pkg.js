"use strict";

const writePkg = require.requireActual("write-pkg");
const registry = new Map();

// by default, act like a spy that populates registry
const mockWritePkg = jest.fn((fp, data) => {
  registry.set(data.name, data);

  return writePkg(fp, data);
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports = mockWritePkg;
module.exports.registry = registry;
