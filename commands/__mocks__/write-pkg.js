"use strict";

const writePkg = jest.requireActual("write-pkg");
const registry = new Map();

// by default, act like a spy that populates registry
const mockWritePkg = jest.fn((fp, data) => {
  registry.set(data.name, data);

  return writePkg(fp, data);
});

const updatedManifest = (name) => registry.get(name);

// a convenient format for assertions
function updatedVersions() {
  const result = {};

  registry.forEach((pkg, name) => {
    result[name] = pkg.version;
  });

  return result;
}

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports = mockWritePkg;
module.exports.registry = registry;
module.exports.updatedManifest = updatedManifest;
module.exports.updatedVersions = updatedVersions;
