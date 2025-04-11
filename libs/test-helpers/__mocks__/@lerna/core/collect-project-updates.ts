// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

const { collectProjects } = jest.requireActual("@lerna/core");

// collectUpdates.setUpdated(cwd, packageNames...)
// otherwise, enables everything
const updated = new Map();

const mockCollectUpdates = jest.fn((filteredProjects, projectGraph, { cwd }) => {
  const targets = updated.get(cwd);
  const updates = targets
    ? new Map(targets.map((name) => [name, projectGraph.nodes[name]]))
    : new Map(Object.entries(projectGraph.nodes));

  return Array.from(updates.values());
});

const setUpdated = (cwd, ...names) => updated.set(cwd, names);

// isolate tests
afterEach(() => {
  updated.clear();
});

module.exports.collectProjectUpdates = mockCollectUpdates;
module.exports.collectProjectUpdates.setUpdated = setUpdated;
module.exports.collectProjects = collectProjects;
