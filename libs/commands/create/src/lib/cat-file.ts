import fs from "fs-extra";
import path from "path";

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
