"use strict";

const cmdShim = require("cmd-shim");
const fs = require("fs-extra");
const log = require("npmlog");
const path = require("path");

module.exports = createSymlink;

function createSymlink(src, dest, type, callback) {
  log.silly("createSymlink", [src, dest, type]);

  if (process.platform === "win32") {
    createWindowsSymlink(src, dest, type, callback);
  } else {
    createPosixSymlink(src, dest, type, callback);
  }
}

function createSymbolicLink(src, dest, type, callback) {
  log.silly("createSymbolicLink", [src, dest, type]);

  fs.lstat(dest, err => {
    if (!err) {
      // Something exists at `dest`.  Need to remove it first.
      fs.unlink(dest, () => fs.symlink(src, dest, type, callback));
    } else {
      fs.symlink(src, dest, type, callback);
    }
  });
}

function createPosixSymlink(origin, dest, _type, callback) {
  const type = _type === "exec" ? "file" : _type;
  const src = path.relative(path.dirname(dest), origin);

  createSymbolicLink(src, dest, type, callback);
}

function createWindowsSymlink(src, dest, type, callback) {
  if (type === "exec") {
    cmdShim(src, dest, callback);
  } else {
    createSymbolicLink(src, dest, type, callback);
  }
}
