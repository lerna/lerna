"use strict";

// eslint-disable-next-line import/no-extraneous-dependencies, node/no-extraneous-require
const Project = require("@lerna/project");

module.exports = updateLernaConfig;

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
