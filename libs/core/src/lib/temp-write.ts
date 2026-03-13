/**
 * Adapted from https://github.com/sindresorhus/temp-write/blob/199851974c8af0618e2f1a77023384823f2ae948/index.js
 *
 * Embedded here into lerna directly because we cannot yet migrate to ESM only, and we needed to bump outdated deps.
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "path";

const tempDir = fs.realpathSync(os.tmpdir());

const tempfile = (filePath: any) => path.join(tempDir, randomUUID(), filePath || "");

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
  const write =
    fileContent !== null && typeof fileContent === "object" && typeof fileContent.pipe === "function"
      ? writeStream
      : fs.promises.writeFile;

  await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });
  await write(tempPath, fileContent);

  return tempPath;
}

tempWrite.sync = (fileContent: any, filePath?: string) => {
  const tempPath = tempfile(filePath);

  fs.mkdirSync(path.dirname(tempPath), { recursive: true });
  fs.writeFileSync(tempPath, fileContent);

  return tempPath;
};

export default tempWrite;
