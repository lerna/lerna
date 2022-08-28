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
const { unlinkSync } = require("fs");

const callbacks = new Set();
let isCalled = false;
let isRegistered = false;

function exit(shouldManuallyExit, signal) {
  if (isCalled) {
    return;
  }

  isCalled = true;

  for (const callback of callbacks) {
    callback();
  }

  if (shouldManuallyExit === true) {
    // eslint-disable-next-line no-process-exit
    process.exit(128 + signal); // eslint-disable-line unicorn/no-process-exit
  }
}

// eslint-disable-next-line flowtype/require-return-type
function exitHook(onExit) {
  callbacks.add(onExit);

  if (!isRegistered) {
    isRegistered = true;

    process.once('exit', exit);
    process.once('SIGINT', exit.bind(undefined, true, 2));
    process.once('SIGTERM', exit.bind(undefined, true, 15));

    // PM2 Cluster shutdown message. Caught to support async handlers with pm2, needed because
    // explicitly calling process.exit() doesn't trigger the beforeExit event, and the exit
    // event cannot support async handlers, since the event loop is never called after it.
    process.on('message', message => {
      if (message === 'shutdown') {
        exit(true, -128);
      }
    });
  }

  return () => {
    callbacks.delete(onExit);
  };
}

const writeFileP = promisify(fs.writeFile);

const tempfile = (filePath) => path.join(process.env['LERNA_CACHE_PATH'] || tempDir, 'lerna-' + uuid.v4(), filePath || "");

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

  exitHook(() => {
    try {
      unlinkSync(tempPath);
    } catch (e) {}
    try {
      unlinkSync(path.dirname(tempPath));
    } catch (e) {}
  })

  return tempPath;
};

module.exports.sync = (fileContent, filePath) => {
  const tempPath = tempfile(filePath);

  makeDir.sync(path.dirname(tempPath));
  fs.writeFileSync(tempPath, fileContent);

  return tempPath;
};
