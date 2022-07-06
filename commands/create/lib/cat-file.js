"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports.catFile = catFile;

/**
 * @param {string} baseDir
 * @param {string} fileName
 * @param {string} content
 * @param {string | import('fs-extra').WriteFileOptions} [opts]
 */
function catFile(baseDir, fileName, content, opts = "utf8") {
  return fs.writeFile(path.join(baseDir, fileName), `${content}\n`, opts);
}
