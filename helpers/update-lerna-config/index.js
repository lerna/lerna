"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports = updateLernaConfig;

/**
 * Update a fixture lerna.json inside a test case.
 *
 * This method does not use load-json-file or write-json-file
 * to avoid any mocks that may be in use on those modules.
 *
 * @param {String} testDir where target lerna.json exists
 * @param {Object} updates mixed into existing JSON via Object.assign
 */
function updateLernaConfig(testDir, updates) {
  const lernaJsonLocation = path.join(testDir, "lerna.json");

  return Promise.resolve()
    .then(() => fs.readJSON(lernaJsonLocation))
    .then(lernaJson => Object.assign(lernaJson, updates))
    .then(lernaJson => fs.writeJSON(lernaJsonLocation, lernaJson, { spaces: 2 }));
}
