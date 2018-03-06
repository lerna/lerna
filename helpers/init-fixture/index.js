"use strict";

const tempy = require("tempy");
const copyFixture = require("./copy-fixture");
const gitInit = require("./git-init");

module.exports = initFixture;

function initFixture(startDir) {
  return (fixtureName, commitMessage = "Init commit") => {
    const cwd = tempy.directory();

    return Promise.resolve()
      .then(() => copyFixture(cwd, fixtureName, startDir))
      .then(() => gitInit(cwd, commitMessage))
      .then(() => cwd);
  };
}
