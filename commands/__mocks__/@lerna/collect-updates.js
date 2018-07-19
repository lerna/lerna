"use strict";

// collectUpdates.setUpdated(cwd, packageNames...)
// otherwise, enables everything
const updated = new Map();

const mockCollectUpdates = jest.fn((filteredPackages, packageGraph, { cwd }) => {
  const targets = updated.get(cwd);
  const updates = targets ? new Map(targets.map(name => [name, packageGraph.get(name)])) : packageGraph;

  return Array.from(updates.values());
});

const setUpdated = (cwd, ...names) => updated.set(cwd, names);

module.exports = mockCollectUpdates;
module.exports.setUpdated = setUpdated;
