import child from "child_process";
import os from "os";
import path from "path";

import fs from "graceful-fs";
import { padStart } from "lodash";
import mkdirp from "mkdirp";
import pify from "pify";
import rimraf from "rimraf";
import cpr from "cpr";

const execAsync = pify(child.exec);
const realpathAsync = pify(fs.realpath);

const _cpr = pify(cpr);
const _mkdirpAsync = pify(mkdirp);
const _rimrafAsync = pify(rimraf);

// graceful-fs overrides for rimraf
const { unlink, chmod, stat, lstat, rmdir, readdir } = fs;

export const cp = (from, to) => _cpr(from, to, { overwrite: true });
export const mkdirpAsync = (fp) => _mkdirpAsync(fp, { fs });
export const rimrafAsync = (fp) => _rimrafAsync(fp, { unlink, chmod, stat, lstat, rmdir, readdir });

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
  return mkdirpAsync(tmpDir).then(() => realpathAsync(tmpDir));
}

export function gitInit(cwd, message = "Init commit") {
  return execAsync(`git init . && git add -A && git commit -m "${message}"`, { cwd });
}

export function removeAll(createdDirectories) {
  return Promise.all(createdDirectories.map((dir) => rimrafAsync(dir)));
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
