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
  const relativeSymlink = path.relative(path.dirname(dest), origin);

  if (_type === "exec") {
    // If the target exists, create real symlink. If the target doesn't exist yet,
    // create a shim shell script.
    return fs.pathExists(origin).then(exists => {
      if (exists) {
        return createSymbolicLink(relativeSymlink, dest, type).then(() => fs.chmod(origin, "755"));
      }
      return shShim(origin, dest, type).then(() => fs.chmod(dest, "755"));
    });
  }

  return createSymbolicLink(relativeSymlink, dest, type);
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

function shShim(target, script, type) {
  log.silly("shShim", [target, script, type]);

  const absTarget = path.resolve(path.dirname(script), target);

  const scriptLines = ["#!/bin/sh", `chmod +x ${absTarget} && exec ${absTarget} "$@"`];

  return fs.writeFile(script, scriptLines.join("\n"));
}
