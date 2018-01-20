"use strict";

const cmdShim = require("cmd-shim");
const fs = require("fs-extra");
const log = require("npmlog");
const path = require("path");
const pathExists = require("path-exists");
const readCmdShim = require("read-cmd-shim");

const ChildProcessUtilities = require("./ChildProcessUtilities");

// NOTE: if rimraf moves the location of its executable, this will need to be updated
const RIMRAF_CLI = require.resolve("rimraf/bin");

function ensureEndsWithNewLine(string) {
  return /\n$/.test(string) ? string : `${string}\n`;
}

function chmod(filePath, mode, cb) {
  log.silly("chmod", filePath, mode);
  fs.chmod(filePath, mode, cb);
}

function chmodSync(filePath, mode) {
  log.silly("chmodSync", filePath, mode);
  fs.chmodSync(filePath, mode);
}

function mkdirp(filePath, callback) {
  log.silly("mkdirp", filePath);
  fs.ensureDir(filePath, callback);
}

function mkdirpSync(filePath) {
  log.silly("mkdirpSync", filePath);
  fs.ensureDirSync(filePath);
}

function readdirSync(filePath) {
  log.silly("readdirSync", filePath);
  return fs.readdirSync(filePath);
}

function existsSync(filePath) {
  log.silly("existsSync", filePath);
  return pathExists.sync(filePath);
}

function writeFile(filePath, fileContents, callback) {
  log.silly("writeFile", [filePath, fileContents]);
  fs.writeFile(filePath, ensureEndsWithNewLine(fileContents), callback);
}

function rename(from, to, callback) {
  log.silly("rename", [from, to]);
  fs.rename(from, to, callback);
}

function renameSync(from, to) {
  log.silly("renameSync", [from, to]);
  fs.renameSync(from, to);
}

function writeFileSync(filePath, fileContents) {
  log.silly("writeFileSync", [filePath, fileContents]);
  fs.writeFileSync(filePath, ensureEndsWithNewLine(fileContents));
}

function readFileSync(filePath) {
  log.silly("readFileSync", filePath);
  return fs.readFileSync(filePath, "utf8").trim();
}

function statSync(filePath) {
  log.silly("statSync", filePath);
  return fs.statSync(filePath);
}

function rimraf(dirPath, callback) {
  log.silly("rimraf", dirPath);
  // Shelling out to a child process for a noop is expensive.
  // Checking if `dirPath` exists to be removed is cheap.
  // This lets us short-circuit if we don't have anything to do.

  return pathExists(dirPath).then(exists => {
    if (!exists) {
      return callback();
    }

    // globs only return directories with a trailing slash
    const slashed = path.normalize(`${dirPath}/`);
    const args = [RIMRAF_CLI, "--no-glob", slashed];

    // We call this resolved CLI path in the "path/to/node path/to/cli <..args>"
    // pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
    return ChildProcessUtilities.spawn(process.execPath, args, {}, err => {
      log.verbose("rimraf", "removed", dirPath);
      callback(err);
    });
  });
}

function symlink(src, dest, type, callback) {
  log.silly("symlink", [src, dest, type]);
  if (process.platform === "win32") {
    createWindowsSymlink(src, dest, type, callback);
  } else {
    createPosixSymlink(src, dest, type, callback);
  }
}

function unlinkSync(filePath) {
  log.silly("unlinkSync", filePath);
  fs.unlinkSync(filePath);
}

function isSymlink(filePath) {
  log.silly("isSymlink", filePath);
  let result;

  if (process.platform === "win32") {
    result = resolveWindowsSymlink(filePath);
  } else {
    result = resolvePosixSymlink(filePath);
  }

  log.verbose("isSymlink", [filePath, result]);
  return result;
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
  const destDir = path.dirname(dest);
  Promise.all([fs.realpath(origin), fs.realpath(destDir)])
    .then(([realOrigin, realDestDir]) => {
      const src = path.relative(realDestDir, realOrigin);
      createSymbolicLink(src, dest, type, callback);
    })
    .catch(callback);
}

function createWindowsSymlink(src, dest, type, callback) {
  if (type === "exec") {
    cmdShim(src, dest, callback);
  } else {
    createSymbolicLink(src, dest, type, callback);
  }
}

function resolveSymbolicLink(filePath, resolver) {
  const lstat = fs.lstatSync(filePath);
  const resolvedPath = lstat.isSymbolicLink() ? resolver() : false;

  return {
    resolvedPath,
    lstat,
  };
}

function resolvePosixSymlink(filePath) {
  return resolveSymbolicLink(filePath, () => fs.realpathSync(filePath)).resolvedPath;
}

function resolveWindowsSymlink(filePath) {
  const { resolvedPath, lstat } = resolveSymbolicLink(filePath, () =>
    path.resolve(path.dirname(filePath), fs.readlinkSync(filePath))
  );

  if (lstat.isFile() && !resolvedPath) {
    try {
      return path.resolve(path.dirname(filePath), readCmdShim.sync(filePath));
    } catch (e) {
      return false;
    }
  }

  return resolvedPath && path.resolve(resolvedPath);
}

exports.chmod = chmod;
exports.chmodSync = chmodSync;
exports.mkdirp = mkdirp;
exports.mkdirpSync = mkdirpSync;
exports.readdirSync = readdirSync;
exports.existsSync = existsSync;
exports.writeFile = writeFile;
exports.rename = rename;
exports.renameSync = renameSync;
exports.writeFileSync = writeFileSync;
exports.readFileSync = readFileSync;
exports.statSync = statSync;
exports.rimraf = rimraf;
exports.symlink = symlink;
exports.unlinkSync = unlinkSync;
exports.isSymlink = isSymlink;
