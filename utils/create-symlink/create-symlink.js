"use strict";

const cmdShim = require("@zkochan/cmd-shim");
const fs = require("fs-extra");
const log = require("npmlog");
const path = require("path");

module.exports = createSymlink;

function createSymlink(src, dest, type) {
  log.silly("createSymlink", [src, dest, type]);

  if (process.platform === "win32") {
    return createWindowsSymlink(src, dest, type);
  }

  return createPosixSymlink(src, dest, type);
}

function createSymbolicLink(src, dest, type) {
  log.silly("createSymbolicLink", [src, dest, type]);

  return fs
    .lstat(dest)
    .then(() => fs.unlink(dest))
    .catch(() => {
      /* nothing exists at destination */
    })
    .then(() => fs.symlink(src, dest, type));
}

function createPosixSymlink(src, dest, _type) {
  const type = _type === "exec" ? "file" : _type;
  const relativeSymlink = path.relative(path.dirname(dest), src);

  if (_type === "exec") {
    // If the src exists, create a real symlink.
    // If the src doesn't exist yet, create a shim shell script.
    return fs.pathExists(src).then(exists => {
      if (exists) {
        return createSymbolicLink(relativeSymlink, dest, type).then(() => fs.chmod(src, 0o755));
      }

      return shShim(src, dest, type).then(() => fs.chmod(dest, 0o755));
    });
  }

  return createSymbolicLink(relativeSymlink, dest, type);
}

function createWindowsSymlink(src, dest, type) {
  if (type === "exec") {
    return cmdShim(src, dest);
  }

  return createSymbolicLink(src, dest, type);
}

function shShim(src, dest, type) {
  log.silly("shShim", [src, dest, type]);

  const absTarget = path.resolve(path.dirname(dest), src);
  const scriptLines = ["#!/bin/sh", `chmod +x ${absTarget} && exec ${absTarget} "$@"`];

  return fs.writeFile(dest, scriptLines.join("\n"));
}
