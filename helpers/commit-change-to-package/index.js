"use strict";

const path = require("path");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");

module.exports = commitChangeToPackage;

function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = path.join(cwd, "packages", packageName, "package.json");

  // QQ no async/await yet...
  let chain = Promise.resolve();

  chain = chain.then(() => loadJsonFile(packageJSONPath));
  chain = chain.then(pkg => writeJsonFile(packageJSONPath, Object.assign(pkg, data)));
  chain = chain.then(() => gitAdd(cwd, packageJSONPath));
  chain = chain.then(() => gitCommit(cwd, commitMsg));

  return chain;
}
