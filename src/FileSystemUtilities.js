import log from "npmlog";
import fs from "fs-promise";
import pathExists from "path-exists";
import cmdShim from "cmd-shim";
import readCmdShim from "read-cmd-shim";
import path from "path";
import ChildProcessUtilities from "./ChildProcessUtilities";

const ENDS_WITH_NEW_LINE = /\n$/;

function ensureEndsWithNewLine(string) {
  return ENDS_WITH_NEW_LINE.test(string) ? string : string + "\n";
}

// NOTE: if rimraf moves the location of its executable, this will need to be updated
const RIMRAF_CLI = require.resolve("rimraf/bin");

// globs only return directories with a trailing slash
function trailingSlash(filePath) {
  return path.normalize(`${filePath}/`);
}

export default class FileSystemUtilities {
  static mkdirp(filePath, callback) {
    log.silly("mkdirp", filePath);
    fs.ensureDir(filePath, callback);
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

  static rimraf(dirPaths, callback) {
    log.silly("rimraf", dirPaths);
    // Shelling out to a child process for a noop is expensive.
    // Checking if `dirPath` exists to be removed is cheap.
    // This lets us short-circuit if we don't have anything to do.
    const mapper = (dir) => Promise.all([pathExists(dir), dir]);

    return Promise.all(dirPaths.map(mapper))
      .then((values) => values.filter((x) => x[0]).map((x) => x[1]))
      .then((candidates) => {
        if (!candidates.length) {
          log.verbose("rimraf", "no directories to delete");
          return callback();
        }

        const args = candidates.map(trailingSlash);
        args.unshift("--no-glob");
        args.unshift(RIMRAF_CLI);

        // We call this resolved CLI path in the "path/to/node path/to/cli <..args>"
        // pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
        return ChildProcessUtilities.spawn(process.execPath, args, {}, () => {
          log.verbose("rimraf", "deleted %j", candidates);
          callback();
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
  fs.lstat(dest, (err) => {
    if (!err) {
      // Something exists at `dest`.  Need to remove it first.
      fs.unlink(dest, () => fs.symlink(src, dest, type, callback));
    } else {
      fs.symlink(src, dest, type, callback);
    }
  });
}

function createPosixSymlink(origin, dest, type, callback) {
  if (type === "exec") {
    type = "file";
  }
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
