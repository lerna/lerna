import child from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

import { padStart } from "lodash";
import mkdirp from "mkdirp";
import pify from "pify";
import rimraf from "rimraf";

export const execAsync = pify(child.exec);
export const mkdirpAsync = pify(mkdirp);
export const realpathAsync = pify(fs.realpath);
export const rimrafAsync = pify(rimraf);

export function getTempDir(suffix) {
  return execAsync("git rev-parse --short HEAD").then((sha) => {
    // e.g., "lerna-12345-deadbeef"
    const prefix = [
      "lerna",
      process.pid,
      sha.trim(),
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
  });
}

export function gitInit(testDir, message = "Init commit") {
  const opts = { cwd: testDir };

  return Promise.resolve()
    .then(() => execAsync("git init .", opts))
    .then(() => execAsync("git add -A", opts))
    .then(() => execAsync(`git commit -m \"${message}\"`, opts));
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
