"use strict";

const path = require("path");
const fs = require("fs-extra");
const tempy = require("tempy");
const { copyFixture } = require("@lerna-test/copy-fixture");
const { gitAdd } = require("@lerna-test/git-add");
const { gitCommit } = require("@lerna-test/git-commit");
const { gitInit } = require("@lerna-test/git-init");

module.exports = initNamedFixture;

function initNamedFixture(startDir) {
  return (dirName, fixtureName, commitMessage = "Init commit") => {
    const cwd = path.join(tempy.directory(), dirName);
    let chain = Promise.resolve();

    chain = chain.then(() => fs.ensureDir(cwd));
    chain = chain.then(() => process.chdir(cwd));
    chain = chain.then(() => copyFixture(cwd, fixtureName, startDir));
    chain = chain.then(() => gitInit(cwd, "."));

    if (commitMessage) {
      chain = chain.then(() => gitAdd(cwd, "-A"));
      chain = chain.then(() => gitCommit(cwd, commitMessage));
    }

    return chain.then(() => cwd);
  };
}
