"use strict";

const execa = require("execa");
const fileUrl = require("file-url");
const tempy = require("tempy");
const initFactory = require("@lerna-test/init-fixture");

module.exports = cloneFixture;

function cloneFixture(startDir) {
  const initFixture = initFactory(startDir);

  return (...args) =>
    initFixture(...args).then(cwd => {
      const repoDir = tempy.directory();
      const repoUrl = fileUrl(repoDir, { resolve: false });

      return execa("git", ["init", "--bare"], { cwd: repoDir })
        .then(() => execa("git", ["checkout", "-B", "main"], { cwd }))
        .then(() => execa("git", ["remote", "add", "origin", repoUrl], { cwd }))
        .then(() => execa("git", ["push", "-u", "origin", "main"], { cwd }))
        .then(() => ({
          cwd,
          repository: repoUrl,
        }));
    });
}
