"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports = catFile;

function catFile(baseDir, fileName, content, opts = "utf8") {
  return fs.writeFile(path.join(baseDir, fileName), `${content}\n`, opts);
}
