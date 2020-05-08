"use strict";

const findFixture = require("@lerna-test/find-fixture");
const fs = require("fs-extra");

module.exports = copyFixture;

function copyFixture(targetDir, fixtureName, cwd) {
  return findFixture(cwd, fixtureName).then((fp) => {
    return fs.copy(fp, targetDir);
  });
}
