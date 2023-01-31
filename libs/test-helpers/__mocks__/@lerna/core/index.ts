/* eslint-disable @typescript-eslint/no-var-requires */

const collectUpdates = require("./collect-updates");
const checkWorkingTree = require("./check-working-tree");
const conventionalCommits = require("./conventional-commits");
const { output } = require("./output");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const prompt = require("./prompt");
const npmDistTag = require("./npm-dist-tag");
const { hasNpmVersion } = require("./has-npm-version");
const { packDirectory } = require("./pack-directory");
const { npmPublish } = require("./npm-publish");
const { runLifecycle, createRunner } = require("./run-lifecycle");
const { createGitLabClient } = require("./gitlab-client");
const { createGitHubClient, parseGitRepo } = require("./github-client");

module.exports = {
  ...jest.requireActual("@lerna/core"),
  output,
  ...collectUpdates,
  ...prompt,
  ...checkWorkingTree,
  ...conventionalCommits,
  createGitLabClient,
  createGitHubClient,
  parseGitRepo,
  npmDistTag,
  hasNpmVersion,
  runLifecycle,
  createRunner,
  npmPublish,
  packDirectory,
  createSymlink: jest.fn(),
  npmRunScript: jest.fn(),
  npmRunScriptStreaming: jest.fn(),
  promptConfirmation: jest.fn(),
  rimrafDir: jest.fn(),
  npmInstall: jest.fn(),
  npmInstallDependencies: jest.fn(),
  getOneTimePassword: jest.fn(),
};
