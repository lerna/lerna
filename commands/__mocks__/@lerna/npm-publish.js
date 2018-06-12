"use strict";

const fs = require("fs-extra");
const path = require("path");

const registry = new Map();

// by default, act like a spy that populates registry
const mockNpmPublish = jest.fn((pkg, tag) => {
  const entry = { tag };
  registry.set(pkg.name, entry);

  return Promise.resolve()
    .then(() => fs.readdir(pkg.location))
    .then(filenames => {
      entry.licenseBasename = filenames.find(f => f.match(/^licen[cs]e/i));

      if (entry.licenseBasename) {
        return fs.readFile(path.join(pkg.location, entry.licenseBasename), { encoding: "utf8" });
      }
    })
    .then(licenseText => {
      entry.licenseText = licenseText;
    });
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

module.exports = mockNpmPublish;
module.exports.registry = registry;
