"use strict";

const fs = require("fs-extra");
const path = require("path");
const globby = require("globby");
const constants = require("./constants");

module.exports = copyFixture;

async function copyFixture(targetDir, fixturePath) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);
  await fs.copy(fixtureDir, targetDir);

  const jsonFiles = await globby(["./package.json", "**/lerna.json"], { cwd: targetDir, absolute: true });
  await Promise.all(jsonFiles.map(fileName => transform(fileName)));
}

/**
 * During fixture copy, replace "__TEST_VERSION__" with the current version
 * and "__TEST_PKG_URL__" with the generated file-url.
 * This is primarily for integration tests, but doesn't hurt unit tests.
 *
 * @param {String} fileName source path of file being copied
 */
async function transform(fileName) {
  let data = await fs.readFile(fileName, "utf8");

  data = data.replace(constants.__TEST_VERSION__, constants.LERNA_VERSION);
  data = data.replace(constants.__TEST_PKG_URL__, constants.LERNA_PKG_URL);

  return fs.writeFile(fileName, data, "utf8");
}
