"use strict";

const execa = require("execa");
const fileUrl = require("file-url");
const tempy = require("tempy");
const gitInit = require("@lerna-test/git-init");
const initFactory = require("@lerna-test/init-fixture");

module.exports = cloneFixture;

function cloneFixture(startDir) {
  const initFixture = initFactory(startDir);

  return (...args) =>
    initFixture(...args).then(cwd => {
      const repoDir = tempy.directory();
      const repoUrl = fileUrl(repoDir, { resolve: false });

      return gitInit(repoDir, "--bare")
        .then(() => execa("git", ["remote", "add", "origin", repoUrl], { cwd }))
        .then(() => execa("git", ["push", "-u", "origin", "master"], { cwd }))
        .then(() => ({
          cwd,
          repository: repoUrl,
        }));
    });
}
