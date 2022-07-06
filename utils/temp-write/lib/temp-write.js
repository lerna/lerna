/**
 * All credit to https://github.com/sindresorhus/temp-write/blob/199851974c8af0618e2f1a77023384823f2ae948/index.js
 *
 * Embedded here into lerna directly because we cannot yet migrate to ESM only, and we needed to bump outdated deps.
 */

"use strict";

const { promisify } = require("util");
const path = require("path");
const fs = require("graceful-fs");
const isStream = require("is-stream");
const makeDir = require("make-dir");
const uuid = require("uuid");
const tempDir = require("temp-dir");

const writeFileP = promisify(fs.writeFile);

const tempfile = (filePath) => path.join(tempDir, uuid.v4(), filePath || "");

const writeStream = async (filePath, fileContent) =>
  new Promise((resolve, reject) => {
    const writable = fs.createWriteStream(filePath);

    fileContent
      .on("error", (error) => {
        // Be careful to reject before writable.end(), otherwise the writable's
        // 'finish' event will fire first and we will resolve the promise
        // before we reject it.
        reject(error);
        fileContent.unpipe(writable);
        writable.end();
      })
      .pipe(writable)
      .on("error", reject)
      .on("finish", resolve);
  });

module.exports = async (fileContent, filePath) => {
  const tempPath = tempfile(filePath);
  const write = isStream(fileContent) ? writeStream : writeFileP;

  await makeDir(path.dirname(tempPath));
  await write(tempPath, fileContent);

  return tempPath;
};

module.exports.sync = (fileContent, filePath) => {
  const tempPath = tempfile(filePath);

  makeDir.sync(path.dirname(tempPath));
  fs.writeFileSync(tempPath, fileContent);

  return tempPath;
};
