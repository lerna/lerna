// @flow

import pathExists from "path-exists";
import logger from "./logger";
import mkdirp from "mkdirp";
import rimraf from "rimraf";
import fs from "fs";
import cmdShim from "cmd-shim";
import readCmdShim from "read-cmd-shim";
import { resolve, dirname } from "path";

const ENDS_WITH_NEW_LINE = /\n$/;

function ensureEndsWithNewLine(string) {
  return ENDS_WITH_NEW_LINE.test(string) ? string : string + "\n";
}

export default class FileSystemUtilities {
  @logger.logifySync()
  static mkdirSync(filePath: string) {
    fs.mkdirSync(filePath);
  }

  @logger.logifyAsync()
  static mkdirp(filePath: string, callback: Function) {
    mkdirp(filePath, callback);
  }

  @logger.logifySync()
  static readdirSync(filePath: string) {
    return fs.readdirSync(filePath);
  }

  @logger.logifySync()
  static existsSync(filePath: string) {
    return pathExists.sync(filePath);
  }

  @logger.logifyAsync()
  static writeFile(filePath: string, fileContents: string, callback: Function) {
    fs.writeFile(filePath, ensureEndsWithNewLine(fileContents), callback);
  }

  @logger.logifySync()
  static writeFileSync(filePath: string, fileContents: string) {
    fs.writeFileSync(filePath, ensureEndsWithNewLine(fileContents));
  }

  @logger.logifySync()
  static readFileSync(filePath: string) {
    return fs.readFileSync(filePath, "utf-8").toString().trim();
  }

  @logger.logifyAsync()
  static rimraf(filePath: string, callback: Function) {
    rimraf(filePath, callback);
  }

  @logger.logifyAsync()
  static symlink(src: string, dest: string, type: string, callback: Function) {
    if (type === "exec") {
      if (process.platform === "win32") {
        cmdShim(src, dest, callback);
        return;
      }
      type = "file";
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
  static unlinkSync(filePath: string) {
    fs.unlinkSync(filePath);
  }

  @logger.logifySync()
  static isSymlink(path: string) {
    const lstat = fs.lstatSync(path);
    let isSymlink = lstat && lstat.isSymbolicLink()
      ? fs.readlinkSync(path)
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
