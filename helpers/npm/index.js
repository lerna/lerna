"use strict";

const globby = require("globby");
const loadJsonFile = require("load-json-file");

exports.loadManifests = function loadManifests(cwd) {
  return globby(
    [
      // all child packages, at any level
      "**/package.json",
      // but not the root
      "!package.json",
      // and not installed
      "!**/node_modules",
    ],
    {
      cwd,
      absolute: true,
      followSymbolicLinks: false,
    }
  ).then((files) => Promise.all(files.sort().map((fp) => loadJsonFile(fp))));
};
