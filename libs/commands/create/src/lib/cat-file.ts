import fs from "fs-extra";
import path from "path";

/**
 * @param {string} baseDir
 * @param {string} fileName
 * @param {string} content
 * @param {string | import('fs-extra').WriteFileOptions} [opts]
 */
export function catFile(baseDir: any, fileName: any, content: any, opts = "utf8" as const) {
  return fs.writeFile(path.join(baseDir, fileName), `${content}\n`, opts);
}
