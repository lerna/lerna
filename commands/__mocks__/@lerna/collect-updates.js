"use strict";

const { collectPackages, getPackagesForOption } = jest.requireActual("@lerna/collect-updates");

// collectUpdates.setUpdated(cwd, packageNames...)
// otherwise, enables everything
const updated = new Map();

const mockCollectUpdates = jest.fn((filteredPackages, packageGraph, { cwd }) => {
  const targets = updated.get(cwd);
  const updates = targets ? new Map(targets.map(name => [name, packageGraph.get(name)])) : packageGraph;

  return Array.from(updates.values());
});

const setUpdated = (cwd, ...names) => updated.set(cwd, names);

// isolate tests
afterEach(() => {
  updated.clear();
});

module.exports = mockCollectUpdates;
module.exports.setUpdated = setUpdated;
module.exports.collectPackages = collectPackages;
module.exports.getPackagesForOption = getPackagesForOption;
