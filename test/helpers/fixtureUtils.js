import child from "child_process";
import os from "os";
import path from "path";

import fs from "graceful-fs";
import { padStart } from "lodash";
import mkdirp from "mkdirp";
import pify from "pify";
import rimraf from "rimraf";

const CURRENT_SHA = child.execSync("git rev-parse --short HEAD", {
  cwd: __dirname,
  encoding: "utf8",
}).trim();

const execAsync = pify(child.exec);
const realpathAsync = pify(fs.realpath);

const _mkdirpAsync = pify(mkdirp);
const _rimrafAsync = pify(rimraf);

// graceful-fs overrides for rimraf
const { unlink, chmod, stat, lstat, rmdir, readdir } = fs;

export const mkdirpAsync = (fp) => _mkdirpAsync(fp, { fs });
export const rimrafAsync = (fp) => _rimrafAsync(fp, { unlink, chmod, stat, lstat, rmdir, readdir });

export function getTempDir(suffix) {
  // e.g., "lerna-12345-deadbeef"
  const prefix = [
    "lerna",
    process.pid,
    CURRENT_SHA,
  ];

  if (suffix) {
    // e.g., "lerna-12345-deadbeef-external"
    prefix.push(suffix);
  }

  const tmpDir = path.join(os.tmpdir() || "/tmp", prefix.join("-"));

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
