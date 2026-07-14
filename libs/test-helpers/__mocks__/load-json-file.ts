// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import path from "path";
import normalizePath from "normalize-path";
import { afterEach, vi } from "vitest";

const actual = await vi.importActual<any>("load-json-file");
const loadJsonFile = actual.default ?? actual;

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
const mockLoadJsonFile = vi.fn((manifestLocation) => {
  incrementCalled(asyncRegistry, manifestLocation);

  return loadJsonFile(manifestLocation);
});

const mockLoadJsonFileSync = vi.fn((manifestLocation) => {
  incrementCalled(syncRegistry, manifestLocation);

  return loadJsonFile.sync(manifestLocation);
});

// keep test data isolated
afterEach(() => {
  asyncRegistry.clear();
  syncRegistry.clear();
});

export default Object.assign(mockLoadJsonFile, {
  registry: asyncRegistry,
  sync: Object.assign(mockLoadJsonFileSync, { registry: syncRegistry }),
});
