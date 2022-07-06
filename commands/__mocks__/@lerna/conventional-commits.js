"use strict";

const fs = jest.requireActual("fs-extra");
const path = require("path");
const semver = require("semver");

const mockRecommendVersion = jest.fn().mockName("recommendVersion");
const mockUpdateChangelog = jest.fn().mockName("updateChangelog");

mockRecommendVersion.mockImplementation((node) => semver.inc(node.version, "patch"));

mockUpdateChangelog.mockImplementation((pkg) => {
  const filePath = path.join(pkg.location, "CHANGELOG.md");

  // grumble grumble re-implementing the implementation
  return fs.outputFile(filePath, "changelog", "utf8").then(() => ({
    logPath: filePath,
    newEntry: pkg.version ? `${pkg.name} - ${pkg.version}` : pkg.name,
  }));
});

exports.recommendVersion = mockRecommendVersion;
exports.updateChangelog = mockUpdateChangelog;
