"use strict";

const packDirectoryRegistry = new Set();
const getPackedRegistry = new Set();
const logPackedRegistry = new Set();

const mockPackDirectory = jest.fn((pkg) => {
  packDirectoryRegistry.add(pkg.name);

  return Promise.resolve(Buffer.from("MOCK"));
});

const mockGetPacked = jest.fn((pkg) => {
  getPackedRegistry.add(pkg.name);

  return Promise.resolve({
    name: pkg.name,
  });
});

const mockLogPacked = jest.fn((contents) => {
  logPackedRegistry.add(contents.name);
});

// keep test data isolated
afterEach(() => {
  packDirectoryRegistry.clear();
  getPackedRegistry.clear();
  logPackedRegistry.clear();
});

module.exports.packDirectory = mockPackDirectory;
module.exports.packDirectory.registry = packDirectoryRegistry;

module.exports.getPacked = mockGetPacked;
module.exports.getPacked.registry = getPackedRegistry;

module.exports.logPacked = mockLogPacked;
module.exports.logPacked.registry = logPackedRegistry;
