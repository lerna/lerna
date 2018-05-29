"use strict";

const fs = require.requireActual("fs-extra");
const path = require("path");

const mockConventionalCommits = jest.genMockFromModule("@lerna/conventional-commits");

mockConventionalCommits.updateChangelog.mockImplementation(pkg => {
  const filePath = path.join(pkg.location, "CHANGELOG.md");

  // grumble grumble re-implementing the implementation
  return fs.outputFile(filePath, "changelog", "utf8").then(() => filePath);
});

function mockBumps(...bumps) {
  bumps.forEach(bump => mockConventionalCommits.recommendVersion.mockResolvedValueOnce(bump));
}

module.exports = mockConventionalCommits;
module.exports.mockBumps = mockBumps;
