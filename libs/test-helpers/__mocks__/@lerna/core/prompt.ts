// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { afterEach, vi } from "vitest";

let choiceIndices = [];
afterEach(() => {
  choiceIndices = [];
});

const mockConfirm = vi.fn(() => Promise.resolve(true));
const mockSelect = vi.fn((_, { choices }) => {
  // default selection is "patch"
  const idx = choiceIndices.shift() || 0;

  // each choice => { value: '<semver>', name: '<desc>' }
  return Promise.resolve(choices[idx].value);
});
const mockInput = vi.fn(() => Promise.resolve());

const semverIndex = new Map(
  ["patch", "minor", "major", "prepatch", "preminor", "premajor", "PRERELEASE", "CUSTOM"].map(
    (keyword, idx) => [keyword, idx]
  )
);

mockSelect.chooseBump = (keyword) => {
  choiceIndices.push(semverIndex.get(keyword));
};

export const promptConfirmation = mockConfirm;
export const promptSelectOne = mockSelect;
export const promptTextInput = mockInput;
