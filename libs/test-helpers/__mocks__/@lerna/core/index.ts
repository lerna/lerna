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
const collectProjectUpdates = require("./collect-project-updates");

// writePackage mock: intercepts Package.prototype.serialize to record
// what was written, exposing updatedVersions() and updatedManifest() helpers.
const realCore = jest.requireActual("@lerna/core");

const registry = new Map();
const origSerialize = realCore.Package.prototype.serialize;

realCore.Package.prototype.serialize = function () {
  const json = this.toJSON();
  registry.set(json.name, json);
  return origSerialize.call(this);
};

const writePackage: any = jest.fn();
writePackage.registry = registry;
writePackage.updatedManifest = (name: string) => registry.get(name);
writePackage.updatedVersions = () => {
  const result: Record<string, string> = {};
  registry.forEach((pkg: any, name: string) => {
    result[name] = pkg.version;
  });
  return result;
};

afterEach(() => {
  registry.clear();
});

module.exports = {
  ...realCore,
  output,
  ...prompt,
  ...checkWorkingTree,
  ...conventionalCommits,
  ...collectProjectUpdates,
  createGitLabClient,
  createGitHubClient,
  parseGitRepo,
  npmDistTag,
  hasNpmVersion,
  runLifecycle,
  createRunner,
  npmPublish,
  packDirectory,
  npmRunScript: jest.fn(),
  npmRunScriptStreaming: jest.fn(),
  promptConfirmation: jest.fn(),
  rimrafDir: jest.fn(),
  npmInstall: jest.fn(),
  npmInstallDependencies: jest.fn(),
  getOneTimePassword: jest.fn(),
  gitCheckout: jest.fn(),
  writePackage,
};
