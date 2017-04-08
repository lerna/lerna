import os from "os";
import path from "path";

import fs from "fs-promise";
import { padStart } from "lodash";
import execa from "execa";
import replaceStream from "replacestream";

import * as constants from "./constants";

export function getTempDir(fixtureName) {
  // e.g., "lerna-1490053388515-663678-BootstrapCommand_01_basic"
  const prefix = [
    "lerna",
    Date.now(),
    Math.floor(Math.random() * 1e6),
    fixtureName,
  ];

  const tmpDir = path.join(os.tmpdir(), prefix.join("-"));

  // We realpath because OS X symlinks /var -> /private/var
  // and require() also calls realpath on its argument.
  // Because we use require() to load package.json, it is
  // also necessary to completely resolve the tmpDir.
  return fs.ensureDir(tmpDir).then(() => fs.realpath(tmpDir));
}

export function gitInit(cwd, message = "Init commit") {
  const opts = { cwd };
  return Promise.resolve()
    .then(() => execa("git", ["init", "."], opts))
    .then(() => execa("git", ["add", "-A"], opts))
    .then(() => execa("git", ["commit", "-m", message], opts));
}

export function removeAll(createdDirectories) {
  return Promise.all(createdDirectories.map((dir) => fs.remove(dir)));
}

export function fixtureNamer() {
  let counter = 0;

  return (fixturePath) => {
    counter += 1; // 1-based

    const parts = fixturePath.split("/");

    // "BootstrapCommand/basic" => "BootstrapCommand_01_basic"
    parts.splice(1, 0, padStart(counter, 2, "0"));

    return parts.join("_");
  };
}

/**
During fixture copy, replace "__TEST_VERSION__" with the current version.
This is primarily for integration tests, but doesn't hurt unit tests.

@param {stream.Readable} readStream
@param {stream.Writable} writeStream
@param {Object} file metadata
@property {String} file.name source path of file being copied

@see https://github.com/jprichardson/node-fs-extra/blob/master/lib/copy/ncp.js#L105
**/
function transform(readStream, writeStream, file) {
  let stream = readStream;

  if (path.extname(file.name) === ".json") {
    stream = stream.pipe(replaceStream(constants.__TEST_VERSION__, constants.LERNA_VERSION));
    stream = stream.pipe(replaceStream(constants.__TEST_ROOTDIR__, constants.LERNA_ROOTDIR));
    stream = stream.pipe(replaceStream(constants.__TEST_DIR_URL__, constants.LERNA_DIR_URL));
  }

  writeStream.on("open", () => {
    stream.pipe(writeStream);
  });
}

export function copyFixture(fixturePath, testDir) {
  const fixtureDir = path.resolve(__dirname, `../fixtures/${fixturePath}`);

  return fs.copy(fixtureDir, testDir, {
    transform,
  });
}
