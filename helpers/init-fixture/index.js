"use strict";

const tempy = require("tempy");
const copyFixture = require("./copy-fixture");
const gitInit = require("./git-init");

module.exports = initFixture;

function initFixture(fixturePath, commitMessage = "Init commit") {
  const testDir = tempy.directory();

  return Promise.resolve()
    .then(() => copyFixture(testDir, fixturePath))
    .then(() => gitInit(testDir, commitMessage))
    .then(() => testDir);
}
