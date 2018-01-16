"use strict";

const tempy = require("tempy");
const copyFixture = require("./copyFixture");
const gitInit = require("./gitInit");

module.exports = initFixture;

async function initFixture(fixturePath, commitMessage = "Init commit") {
  const testDir = tempy.directory();
  await copyFixture(testDir, fixturePath);
  await gitInit(testDir, commitMessage);
  return testDir;
}
