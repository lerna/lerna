/**
 * All credit to https://github.com/sindresorhus/temp-write/blob/199851974c8af0618e2f1a77023384823f2ae948/index.js
 *
 * Embedded here into lerna directly because we cannot yet migrate to ESM only, and we needed to bump outdated deps.
 */
import fs from "graceful-fs";
import isStream from "is-stream";
import makeDir from "make-dir";
import path from "path";
import tempDir from "temp-dir";
import { promisify } from "util";
import * as uuid from "uuid";

const writeFileP = promisify(fs.writeFile);

const tempfile = (filePath: any) => path.join(tempDir, uuid.v4(), filePath || "");

const writeStream = async (filePath: any, fileContent: any) =>
  new Promise((resolve, reject) => {
    const writable = fs.createWriteStream(filePath);

    fileContent
      .on("error", (error: any) => {
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

async function tempWrite(fileContent: any, filePath?: string) {
  const tempPath = tempfile(filePath);
  const write = isStream(fileContent) ? writeStream : writeFileP;

  await makeDir(path.dirname(tempPath));
  await write(tempPath, fileContent);

  return tempPath;
}

tempWrite.sync = (fileContent: any, filePath?: string) => {
  const tempPath = tempfile(filePath);

  makeDir.sync(path.dirname(tempPath));
  fs.writeFileSync(tempPath, fileContent);

  return tempPath;
};

export default tempWrite;
