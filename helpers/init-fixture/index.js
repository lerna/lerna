"use strict";

const tempy = require("tempy");
const copyFixture = require("@lerna-test/copy-fixture");
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitInit = require("@lerna-test/git-init");

module.exports = initFixture;

function initFixture(startDir, skipCommit) {
  return (fixtureName, commitMessage = "Init commit") => {
    const cwd = tempy.directory();

    if (skipCommit) {
      return Promise.resolve()
        .then(() => process.chdir(cwd))
        .then(() => copyFixture(cwd, fixtureName, startDir))
        .then(() => gitInit(cwd, "."))
        .then(() => cwd);
    }

    return Promise.resolve()
      .then(() => process.chdir(cwd))
      .then(() => copyFixture(cwd, fixtureName, startDir))
      .then(() => gitInit(cwd, "."))
      .then(() => gitAdd(cwd, "-A"))
      .then(() => gitCommit(cwd, commitMessage))
      .then(() => cwd);
  };
}
