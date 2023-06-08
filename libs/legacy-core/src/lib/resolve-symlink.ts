import fs from "fs-extra";
import log from "npmlog";
import path from "path";

// read-cmd-shim does not have any types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const readCmdShim = require("read-cmd-shim");

export function resolveSymlink(filePath: string) {
  log.silly("resolveSymlink", filePath);

  let result;

  if (process.platform === "win32") {
    result = resolveWindowsSymlink(filePath);
  } else {
    result = resolvePosixSymlink(filePath);
  }

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.verbose("resolveSymlink", [filePath, result]);

  return result;
}

function resolveSymbolicLink(filePath: string) {
  const lstat = fs.lstatSync(filePath);
  const resolvedPath = lstat.isSymbolicLink()
    ? path.resolve(path.dirname(filePath), fs.readlinkSync(filePath))
    : false;

  return {
    resolvedPath,
    lstat,
  };
}

function resolvePosixSymlink(filePath: string) {
  return resolveSymbolicLink(filePath).resolvedPath;
}

function resolveWindowsSymlink(filePath: string) {
  const { resolvedPath, lstat } = resolveSymbolicLink(filePath);

  if (lstat.isFile() && !resolvedPath) {
    try {
      return path.resolve(path.dirname(filePath), readCmdShim.sync(filePath));
    } catch (e) {
      return false;
    }
  }

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return resolvedPath && path.resolve(resolvedPath);
}
