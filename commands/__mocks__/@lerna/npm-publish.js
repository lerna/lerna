"use strict";

const packed = new Set();
const registry = new Map();

// by default, act like a spy that populates registry
const mockNpmPublish = jest.fn((pkg, tag) => {
  registry.set(pkg.name, tag);

  return Promise.resolve(pkg);
});

const mockNpmPack = jest.fn((rootManifest, packages) => {
  packages.forEach(pkg => {
    packed.add(pkg.name);

    // simulate decoration after npm pack
    pkg.tarball = {
      filename: `${pkg.name}-MOCKED.tgz`,
    };
  });

  return Promise.resolve(packages.slice());
});

const mockMakePacker = jest.fn(rootManifest => batch => mockNpmPack(rootManifest, batch));

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
module.exports.makePacker = mockMakePacker;
module.exports.order = order;
module.exports.packed = packed;
module.exports.registry = registry;
