// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { afterEach, vi } from "vitest";

const { collectProjects } = await vi.importActual("@lerna/core");

// collectProjectUpdates.setUpdated(cwd, packageNames...)
// otherwise, enables everything
const updated = new Map();

const mockCollectUpdates = vi.fn((filteredProjects, projectGraph, { cwd }) => {
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

export const collectProjectUpdates = Object.assign(mockCollectUpdates, { setUpdated });
export { collectProjects };
