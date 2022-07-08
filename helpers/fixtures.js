"use strict";

const execa = require("execa");
const fileUrl = require("file-url");
const tempy = require("tempy");
const fs = require("fs-extra");
const findUp = require("find-up");
const path = require("path");
const { gitAdd, gitCommit, gitInit } = require("./git");

function cloneFixtureFactory(startDir) {
  const initFixture = initFixtureFactory(startDir);

  return (...args) =>
    initFixture(...args).then((cwd) => {
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
exports.cloneFixtureFactory = cloneFixtureFactory;

function findFixture(cwd, fixtureName) {
  return findUp(path.join("__fixtures__", fixtureName), { cwd, type: "directory" }).then((fixturePath) => {
    if (fixturePath === undefined) {
      throw new Error(`Could not find fixture with name "${fixtureName}"`);
    }

    return fixturePath;
  });
}

function copyFixture(targetDir, fixtureName, cwd) {
  return findFixture(cwd, fixtureName).then((fp) => fs.copy(fp, targetDir));
}
exports.copyFixture = copyFixture;

function initFixtureFactory(startDir) {
  return (fixtureName, commitMessage = "Init commit") => {
    const cwd = tempy.directory();
    let chain = Promise.resolve();

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
exports.initFixtureFactory = initFixtureFactory;

function initNamedFixtureFactory(startDir) {
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
exports.initNamedFixtureFactory = initNamedFixtureFactory;
