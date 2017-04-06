import os from "os";
import path from "path";

import fs from "fs-promise";
import { padStart } from "lodash";
import execa from "execa";

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
