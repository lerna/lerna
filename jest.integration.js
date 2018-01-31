"use strict"; // eslint-disable-line strict, lines-around-directive

const path = require("path");

const integrationRootDir = path.resolve(__dirname, "./test/integration");
const setupTestFramework = path.join(integrationRootDir, "_setupTestFramework.js");
const serializePlaceholders = path.resolve(__dirname, "./test/helpers/serializePlaceholders.js");

module.exports = {
  bail: true,
  roots: [integrationRootDir],
  testEnvironment: "node",
  setupTestFrameworkScriptFile: setupTestFramework,
  snapshotSerializers: [serializePlaceholders],
  verbose: true,
};
