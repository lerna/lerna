"use strict";

const path = require("path");
const normalizePath = require("normalize-path");

const loadJsonFile = jest.requireActual("load-json-file");
const asyncRegistry = new Map();
const syncRegistry = new Map();

function incrementCalled(registry, manifestLocation) {
  // mkdtempSync creates dirnames with "lerna-test-" prefix and 6 random chars
  const subPath = manifestLocation.split(/lerna-test-[A-Za-z0-9]{6}/).pop();
  const key = normalizePath(path.dirname(subPath));

  // keyed off directory subpath, _not_ pkg.name (we don't know it yet)
  registry.set(key, (registry.get(key) || 0) + 1);
}

// by default, act like a spy that counts number of times each location was loaded
const mockLoadJsonFile = jest.fn((manifestLocation) => {
  incrementCalled(asyncRegistry, manifestLocation);

  return loadJsonFile(manifestLocation);
});

const mockLoadJsonFileSync = jest.fn((manifestLocation) => {
  incrementCalled(syncRegistry, manifestLocation);

  return loadJsonFile.sync(manifestLocation);
});

// keep test data isolated
afterEach(() => {
  asyncRegistry.clear();
  syncRegistry.clear();
});

module.exports = mockLoadJsonFile;
module.exports.registry = asyncRegistry;
module.exports.sync = mockLoadJsonFileSync;
module.exports.sync.registry = syncRegistry;
