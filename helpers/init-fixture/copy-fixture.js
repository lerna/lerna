"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports = copyFixture;

function copyFixture(targetDir, fixturePath) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);

  return fs.copy(fixtureDir, targetDir);
}
