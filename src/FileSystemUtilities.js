import pathExists from "path-exists";
import logger from "./logger";
import mkdirp from "mkdirp";
import rimraf from "rimraf";
import fs from "fs";
import cmdShim from "cmd-shim";
import readCmdShim from "read-cmd-shim";
import { resolve, dirname, relative } from "path";

const ENDS_WITH_NEW_LINE = /\n$/;

function ensureEndsWithNewLine(string) {
  return ENDS_WITH_NEW_LINE.test(string) ? string : string + "\n";
}

export default class FileSystemUtilities {
  @logger.logifySync()
  static mkdirSync(filePath) {
    fs.mkdirSync(filePath);
  }

  @logger.logifyAsync()
  static mkdirp(filePath, callback) {
    mkdirp(filePath, callback);
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

  @logger.logifySync()
  static writeFileSync(filePath, fileContents) {
    fs.writeFileSync(filePath, ensureEndsWithNewLine(fileContents));
  }

  @logger.logifySync()
  static readFileSync(filePath) {
    return fs.readFileSync(filePath, "utf-8").toString().trim();
  }

  @logger.logifyAsync()
  static rimraf(filePath, callback) {
    rimraf(filePath, callback);
  }

  @logger.logifyAsync()
  static symlink(src, dest, type, callback) {
    if (type === "exec") {
      if (process.platform === "win32") {
        cmdShim(src, dest, callback);
        return;
      }
      type = "file";
    }
    if (process.platform === "win32") {
      src = relative(dirname(dest), src);
    }
    fs.lstat(dest, (err) => {
      if (!err) {
        // Something exists at `dest`.  Need to remove it first.
        fs.unlink(dest, () => fs.symlink(src, dest, type, callback));
      } else {
        fs.symlink(src, dest, type, callback);
      }
    });
  }

  @logger.logifySync()
  static unlinkSync(filePath) {
    fs.unlinkSync(filePath);
  }

  @logger.logifySync()
  static isSymlink(path) {
    const lstat = fs.lstatSync(path);
    let isSymlink = lstat && lstat.isSymbolicLink()
      ? resolve(dirname(path), fs.readlinkSync(path))
      : false;
    if (process.platform === "win32" && lstat) {
      if (lstat.isFile() && !isSymlink) {
        try {
          return resolve(dirname(path), readCmdShim.sync(path));
        } catch (e) {
          return false;
        }
      }
      isSymlink = isSymlink && resolve(isSymlink);
    }
    return isSymlink;
  }
}
