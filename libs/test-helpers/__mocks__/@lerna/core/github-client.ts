// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { afterEach, vi } from "vitest";

const releases = new Map();

// keep test data isolated
afterEach(() => {
  releases.clear();
});

const client = {
  repos: {
    createRelease: vi.fn((opts) => {
      releases.set(opts.name, opts);
      return Promise.resolve();
    }),
  },
};

export const createGitHubClient = Object.assign(
  vi.fn(() => client),
  { releases }
);
export const parseGitRepo = () => ({
  owner: "lerna",
  name: "lerna",
});
