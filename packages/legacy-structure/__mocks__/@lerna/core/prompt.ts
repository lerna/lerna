// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

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

exports.promptConfirmation = mockConfirm;
exports.promptSelectOne = mockSelect;
exports.promptTextInput = mockInput;

const semverIndex = new Map(
  ["patch", "minor", "major", "prepatch", "preminor", "premajor", "PRERELEASE", "CUSTOM"].map(
    (keyword, idx) => [keyword, idx]
  )
);

mockSelect.chooseBump = (keyword) => {
  choiceIndices.push(semverIndex.get(keyword));
};
