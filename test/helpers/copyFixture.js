"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports = copyFixture;

async function copyFixture(targetDir, fixturePath) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);
  await fs.copy(fixtureDir, targetDir);
}
