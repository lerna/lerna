"use strict";

// eslint-disable-next-line import/no-extraneous-dependencies, node/no-extraneous-require
const { Project } = require("@lerna/project");
const normalizeNewline = require("normalize-newline");
const path = require("path");
const normalizePath = require("normalize-path");

const git = require("./git");
const fixtures = require("./fixtures");
const npm = require("./npm");
const cli = require("./cli");

module.exports = {
  ...git,
  ...fixtures,
  ...npm,
  ...cli,
  updateLernaConfig,
  multiLineTrimRight,
  normalizeRelativeDir,
};

/**
 * Update lerna config inside a test case.
 *
 * @param {String} testDir where target lerna.json exists
 * @param {Object} updates mixed into existing JSON via Object.assign
 */
function updateLernaConfig(testDir, updates) {
  const project = new Project(testDir);

  Object.assign(project.config, updates);

  return project.serializeConfig();
}

function multiLineTrimRight(str) {
  return normalizeNewline(str)
    .split("\n")
    .map((line) => line.trimRight())
    .join("\n");
}

function normalizeRelativeDir(testDir, filePath) {
  return normalizePath(path.relative(testDir, filePath));
}
