"use strict";

const cmdShim = require("cmd-shim");
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

function createPosixSymlink(origin, dest, _type) {
  const type = _type === "exec" ? "file" : _type;
  const src = path.relative(path.dirname(dest), origin);

  return createSymbolicLink(src, dest, type);
}

function createWindowsSymlink(src, dest, type) {
  if (type === "exec") {
    return new Promise((resolve, reject) => {
      cmdShim(src, dest, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  return createSymbolicLink(src, dest, type);
}
