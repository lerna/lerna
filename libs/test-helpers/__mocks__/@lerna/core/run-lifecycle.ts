// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { vi } from "vitest";

const mockRunLifecycle = vi.fn((pkg) => Promise.resolve(pkg));
const mockCreateRunner = vi.fn((opts) => (pkg, stage) => {
  // no longer the actual API, but approximates inner logic of default export
  if (pkg.scripts[stage]) {
    return mockRunLifecycle(pkg, stage, opts);
  }

  return Promise.resolve();
});

function getOrderedCalls() {
  return mockRunLifecycle.mock.calls.map(([pkg, script]) => [pkg.name, script]);
}

export const runLifecycle = Object.assign(mockRunLifecycle, { getOrderedCalls });
export const createRunner = mockCreateRunner;
