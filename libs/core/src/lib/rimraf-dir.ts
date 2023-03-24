"use strict";

import log from "npmlog";
import path from "node:path";
import fs from "node:fs";
import pathExists from "path-exists";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

let rimrafBinPath : string | undefined;

export async function useRimrafBinPath() : Promise<string> {
  if(typeof rimrafBinPath === 'string') {
    return rimrafBinPath;
  }

  const filePath = require.resolve('rimraf');
  const directoryPath = path.basename(filePath);

  try {
    const rawFile = await fs.promises.readFile(path.join(directoryPath, 'package.json'), {encoding: 'utf-8'});
    const file = JSON.parse(rawFile);

    rimrafBinPath = file.bin || require.resolve('rimraf/bin');
  } catch (e) {
    rimrafBinPath = require.resolve('rimraf/bin');
  }

  return rimrafBinPath as string;
}

export async function rimrafDir(dirPath: string) {
  log.silly("rimrafDir", dirPath);
  // Shelling out to a child process for a noop is expensive.
  // Checking if `dirPath` exists to be removed is cheap.
  // This lets us short-circuit if we don't have anything to do.

  const fileExists = await pathExists(dirPath);
  if(!fileExists) {
    return;
  }

  const cliPath = await useRimrafBinPath();

  // globs only return directories with a trailing slash
  const slashed = path.normalize(`${dirPath}/`);
  const args = [cliPath, "--no-glob", slashed];

  // We call this resolved CLI path in the "path/to/node path/to/cli <..args>"
  // pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
  return childProcess.spawn(process.execPath, args).then(() => {
    log.verbose("rimrafDir", "removed", dirPath);

    return dirPath;
  });
}
