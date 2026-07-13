// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { afterEach, vi } from "vitest";

const registry = new Map();

// by default, act like a spy that populates registry
const mockNpmPublish = vi.fn((pkg, tarData, opts) => {
  registry.set(pkg.name, opts.tag);

  return Promise.resolve();
});

// a convenient format for assertions
function order() {
  return Array.from(registry.keys());
}

// keep test data isolated
afterEach(() => {
  registry.clear();
});

export const npmPublish = Object.assign(mockNpmPublish, { order, registry });
