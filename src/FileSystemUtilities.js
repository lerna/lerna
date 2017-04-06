import fs from "fs-promise";
import pathExists from "path-exists";
import logger from "./logger";
import cmdShim from "cmd-shim";
import readCmdShim from "read-cmd-shim";
import path from "path";
import ChildProcessUtilities from "./ChildProcessUtilities";

const ENDS_WITH_NEW_LINE = /\n$/;

function ensureEndsWithNewLine(string) {
  return ENDS_WITH_NEW_LINE.test(string) ? string : string + "\n";
}

export default class FileSystemUtilities {
  @logger.logifyAsync()
  static mkdirp(filePath, callback) {
    fs.ensureDir(filePath, callback);
  }

  @logger.logifySync()
  static readdirSync(filePath) {
    return fs.readdirSync(filePath);
  }

  @logger.logifySync()
  static existsSync(filePath) {
    return pathExists.sync(filePath);
  }

  @logger.logifyAsync()
  static writeFile(filePath, fileContents, callback) {
    fs.writeFile(filePath, ensureEndsWithNewLine(fileContents), callback);
  }

  @logger.logifyAsync()
  static rename(from, to, callback) {
    fs.rename(from, to, callback);
  }

  @logger.logifySync()
  static renameSync(from, to) {
    fs.renameSync(from, to);
  }

  @logger.logifySync()
  static writeFileSync(filePath, fileContents) {
    fs.writeFileSync(filePath, ensureEndsWithNewLine(fileContents));
  }

  @logger.logifySync()
  static readFileSync(filePath) {
    return fs.readFileSync(filePath, "utf8").trim();
  }

  @logger.logifySync()
  static statSync(filePath) {
    return fs.statSync(filePath);
  }

  @logger.logifyAsync()
  static rimraf(filePath, callback) {

    // Shelling out to a child process for a noop is expensive.
    // Checking if `filePath` exists to be removed is cheap.
    // This lets us short-circuit if we don't have anything to do.
    pathExists(filePath).then((exists) => {
      if (!exists) return callback();

      // Note: if rimraf moves the location of its executable, this will need to be updated
      ChildProcessUtilities.spawn(require.resolve("rimraf/bin"), [filePath], {}, callback);
    });
  }

  @logger.logifyAsync()
  static symlink(src, dest, type, callback) {
    if (process.platform === "win32") {
      createWindowsSymlink(src, dest, type, callback);
    } else {
      createPosixSymlink(src, dest, type, callback);
    }
  }

  @logger.logifySync()
  static unlinkSync(filePath) {
    fs.unlinkSync(filePath);
  }

  @logger.logifySync()
  static isSymlink(filePath) {
    let result;

    if (process.platform === "win32") {
      result = resolveWindowsSymlink(filePath);
    } else {
      result = resolvePosixSymlink(filePath);
    }

    return result;
  }
}

function createSymbolicLink(src, dest, type, callback) {
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
  const {isSymlink} = resolveSymbolicLink(filePath);
  return isSymlink;
}

function resolveWindowsSymlink(filePath) {
  const {isSymlink, lstat} = resolveSymbolicLink(filePath);

  if (lstat.isFile() && !isSymlink) {
    try {
      return path.resolve(path.dirname(filePath), readCmdShim.sync(filePath));
    } catch (e) {
      return false;
    }
  }

  return isSymlink && path.resolve(isSymlink);
}
