"use strict";

let choiceIndices = [];
afterEach(() => {
  choiceIndices = [];
});

const mockConfirm = jest.fn(() => Promise.resolve(true));
const mockSelect = jest.fn((_, { choices }) => {
  // default selection is "patch"
  const idx = choiceIndices.shift() || 0;

  // each choice => { value: '<semver>', name: '<desc>' }
  return Promise.resolve(choices[idx].value);
});
const mockInput = jest.fn(() => Promise.resolve());

exports.confirm = mockConfirm;
exports.select = mockSelect;
exports.input = mockInput;

const semverIndex = new Map(
  ["patch", "minor", "major", "prepatch", "preminor", "premajor", "PRERELEASE", "CUSTOM"].map(
    (keyword, idx) => [keyword, idx]
  )
);

exports.mockChoices = (...keywords) => {
  choiceIndices = keywords.map(keyword => semverIndex.get(keyword));
};
