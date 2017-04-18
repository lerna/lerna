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

// NOTE: if rimraf moves the location of its executable, this will need to be updated
const RIMRAF_CLI = require.resolve("rimraf/bin");

// globs only return directories with a trailing slash
function trailingSlash(filePath) {
  return path.normalize(`${filePath}/`);
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
  static rimraf(dirPaths, callback) {
    // Shelling out to a child process for a noop is expensive.
    // Checking if `dirPath` exists to be removed is cheap.
    // This lets us short-circuit if we don't have anything to do.
    const mapper = (dir) => Promise.all([pathExists(dir), dir]);

    return Promise.all(dirPaths.map(mapper))
      .then((values) => values.filter((x) => x[0]).map((x) => x[1]))
      .then((candidates) => {
        if (!candidates.length) {
          return callback();
        }

        const args = candidates.map(trailingSlash);
        args.unshift("--no-glob");
        args.unshift(RIMRAF_CLI);

        // We call this resolved CLI path in the "path/to/node path/to/cli <..args>"
        // pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
        return ChildProcessUtilities.spawn(process.execPath, args, {}, callback);
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
