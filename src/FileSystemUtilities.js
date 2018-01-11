import cmdShim from "cmd-shim";
import fs from "fs-extra";
import log from "npmlog";
import path from "path";
import pathExists from "path-exists";
import readCmdShim from "read-cmd-shim";

import ChildProcessUtilities from "./ChildProcessUtilities";

const ENDS_WITH_NEW_LINE = /\n$/;

function ensureEndsWithNewLine(string) {
  return ENDS_WITH_NEW_LINE.test(string) ? string : `${string}\n`;
}

// NOTE: if rimraf moves the location of its executable, this will need to be updated
const RIMRAF_CLI = require.resolve("rimraf/bin");

// globs only return directories with a trailing slash
function trailingSlash(filePath) {
  return path.normalize(`${filePath}/`);
}

export default class FileSystemUtilities {
  static chmod(filePath, mode, cb) {
    log.silly("chmod", filePath, mode);
    fs.chmod(filePath, mode, cb);
  }

  static chmodSync(filePath, mode) {
    log.silly("chmodSync", filePath, mode);
    fs.chmodSync(filePath, mode);
  }

  static mkdirp(filePath, callback) {
    log.silly("mkdirp", filePath);
    fs.ensureDir(filePath, callback);
  }

  static mkdirpSync(filePath) {
    log.silly("mkdirpSync", filePath);
    fs.ensureDirSync(filePath);
  }

  static readdirSync(filePath) {
    log.silly("readdirSync", filePath);
    return fs.readdirSync(filePath);
  }

  static existsSync(filePath) {
    log.silly("existsSync", filePath);
    return pathExists.sync(filePath);
  }

  static writeFile(filePath, fileContents, callback) {
    log.silly("writeFile", [filePath, fileContents]);
    fs.writeFile(filePath, ensureEndsWithNewLine(fileContents), callback);
  }

  static rename(from, to, callback) {
    log.silly("rename", [from, to]);
    fs.rename(from, to, callback);
  }

  static renameSync(from, to) {
    log.silly("renameSync", [from, to]);
    fs.renameSync(from, to);
  }

  static writeFileSync(filePath, fileContents) {
    log.silly("writeFileSync", [filePath, fileContents]);
    fs.writeFileSync(filePath, ensureEndsWithNewLine(fileContents));
  }

  static readFileSync(filePath) {
    log.silly("readFileSync", filePath);
    return fs.readFileSync(filePath, "utf8").trim();
  }

  static statSync(filePath) {
    log.silly("statSync", filePath);
    return fs.statSync(filePath);
  }

  static rimraf(dirPath, callback) {
    log.silly("rimraf", dirPath);
    // Shelling out to a child process for a noop is expensive.
    // Checking if `dirPath` exists to be removed is cheap.
    // This lets us short-circuit if we don't have anything to do.

    return pathExists(dirPath).then(exists => {
      if (!exists) {
        return callback();
      }

      const args = [RIMRAF_CLI, "--no-glob", trailingSlash(dirPath)];

      // We call this resolved CLI path in the "path/to/node path/to/cli <..args>"
      // pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
      return ChildProcessUtilities.spawn(process.execPath, args, {}, err => {
        log.verbose("rimraf", "removed", dirPath);
        callback(err);
      });
    });
  }

  static symlink(src, dest, type, callback) {
    log.silly("symlink", [src, dest, type]);
    if (process.platform === "win32") {
      createWindowsSymlink(src, dest, type, callback);
    } else {
      createPosixSymlink(src, dest, type, callback);
    }
  }

  static unlinkSync(filePath) {
    log.silly("unlinkSync", filePath);
    fs.unlinkSync(filePath);
  }

  static isSymlink(filePath) {
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

function resolveSymbolicLink(filePath) {
  const lstat = fs.lstatSync(filePath);
  const isSymlink = lstat.isSymbolicLink()
    ? path.resolve(path.dirname(filePath), fs.readlinkSync(filePath))
    : false;

  return {
    isSymlink,
    lstat,
  };
}

function resolvePosixSymlink(filePath) {
  const { isSymlink } = resolveSymbolicLink(filePath);
  return isSymlink;
}

function resolveWindowsSymlink(filePath) {
  const { isSymlink, lstat } = resolveSymbolicLink(filePath);

  if (lstat.isFile() && !isSymlink) {
    try {
      return path.resolve(path.dirname(filePath), readCmdShim.sync(filePath));
    } catch (e) {
      return false;
    }
  }

  return isSymlink && path.resolve(isSymlink);
}
