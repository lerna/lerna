"use strict";

const path = require("path");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");

module.exports.updateLockfileVersion = updateLockfileVersion;

function updateLockfileVersion(pkg) {
  const lockfilePath = path.join(pkg.location, "package-lock.json");

  let chain = Promise.resolve();

  chain = chain.then(() => loadJsonFile(lockfilePath).catch(() => {}));
  chain = chain.then((obj) => {
    if (obj) {
      obj.version = pkg.version;

      if (obj.packages && obj.packages[""]) {
        obj.packages[""].version = pkg.version;
      }

      return writeJsonFile(lockfilePath, obj, {
        detectIndent: true,
        indent: 2,
      }).then(() => lockfilePath);
    }
  });

  return chain;
}
