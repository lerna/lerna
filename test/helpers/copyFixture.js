import fs from "fs-extra";
import path from "path";
import replaceStream from "replacestream";
import * as constants from "./constants";

export default copyFixture;

async function copyFixture(targetDir, fixturePath) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);
  await fs.copy(fixtureDir, targetDir, { transform });
}

/**
 * During fixture copy, replace "__TEST_VERSION__" with the current version.
 * This is primarily for integration tests, but doesn't hurt unit tests.
 *
 * @param {stream.Readable} readStream
 * @param {stream.Writable} writeStream
 * @param {Object} file metadata
 * @property {String} file.name source path of file being copied
 *
 * @see https://github.com/jprichardson/node-fs-extra/blob/master/lib/copy/ncp.js#L105
 */
function transform(readStream, writeStream, file) {
  let stream = readStream;

  if (path.extname(file.name) === ".json") {
    stream = stream.pipe(replaceStream(constants.__TEST_VERSION__, constants.LERNA_VERSION));
    stream = stream.pipe(replaceStream(constants.__TEST_PKG_URL__, constants.LERNA_PKG_URL));
  }

  writeStream.on("open", () => {
    stream.pipe(writeStream);
  });
}
