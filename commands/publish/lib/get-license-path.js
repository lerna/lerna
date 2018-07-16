"use strict";

const fs = require("fs-extra");

module.exports = getLicensePath;

function getLicensePath(directory) {
  return Promise.resolve()
    .then(() => fs.readdir(directory))
    .then(filenames => filenames.sort().filter(isLicense)[0] || null);
}

function isLicense(filename) {
  return filename.match(/^licen[cs]e$/i);
}
