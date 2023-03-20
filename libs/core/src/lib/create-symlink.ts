import cmdShim from "cmd-shim";
import fs, { SymlinkType } from "fs-extra";
import log from "npmlog";
import path from "path";

type CreateSymlinkType = SymlinkType | "exec";

export function createSymlink(src: string, dest: string, type: CreateSymlinkType) {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("createSymlink", [src, dest, type]);
  if (src) {
    if (process.platform === "win32") {
      return createWindowsSymlink(src, dest, type);
    }

    return createPosixSymlink(src, dest, type);
  }
  return Promise.resolve();
}

function createSymbolicLink(src: string, dest: string, type: SymlinkType) {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("createSymbolicLink", [src, dest, type]);

  return fs
    .lstat(dest)
    .then(() => fs.unlink(dest))
    .catch(() => {
      /* nothing exists at destination */
    })
    .then(() => fs.symlink(src, dest, type));
}

function createPosixSymlink(src: string, dest: string, _type: CreateSymlinkType) {
  const type = _type === "exec" ? "file" : _type;
  const relativeSymlink = path.relative(path.dirname(dest), src);

  if (_type === "exec") {
    // If the src exists, create a real symlink.
    // If the src doesn't exist yet, create a shim shell script.
    return fs.pathExists(src).then((exists) => {
      if (exists) {
        return createSymbolicLink(relativeSymlink, dest, type).then(() => fs.chmod(src, 0o755));
      }

      return shShim(src, dest, type).then(() => fs.chmod(dest, 0o755));
    });
  }

  return createSymbolicLink(relativeSymlink, dest, type);
}

function createWindowsSymlink(src: string, dest: string, type: CreateSymlinkType) {
  if (type === "exec") {
    // If the src exists, shim directly.
    // If the src doesn't exist yet, create a temp src so cmd-shim doesn't explode.
    return fs.pathExists(src).then((exists) => {
      if (exists) {
        return cmdShim(src, dest);
      }

      return fs
        .outputFile(src, "")
        .then(() => cmdShim(src, dest))
        .then(
          // fs.remove() never rejects
          () => fs.remove(src),
          (err) =>
            fs.remove(src).then(() => {
              // clean up, but don't swallow error
              throw err;
            })
        );
    });
  }

  return createSymbolicLink(src, dest, type);
}

function shShim(src: string, dest: string, type: CreateSymlinkType) {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("shShim", [src, dest, type]);

  const absTarget = path.resolve(path.dirname(dest), src);
  const scriptLines = ["#!/bin/sh", `chmod +x ${absTarget} && exec ${absTarget} "$@"`];

  return fs.writeFile(dest, scriptLines.join("\n"));
}
