"use strict";

const findUp = require("find-up");
const fs = require("fs-extra");
const path = require("path");

module.exports = copyFixture;

function copyFixture(targetDir, fixtureName, cwd) {
  return Promise.resolve()
    .then(() => findUp(path.join("__fixtures__", fixtureName), { cwd }))
    .then(fixtureDir => fs.copy(fixtureDir, targetDir));
}
