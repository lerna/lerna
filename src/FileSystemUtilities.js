import pathExists from "path-exists";
import logger from "./logger";
import mkdirp from "mkdirp";
import rimraf from "rimraf";
import fs from "fs";

export default class FileSystemUtilities {
  @logger.logifySync
  static mkdirSync(filePath) {
    fs.mkdirSync(filePath);
  }

  @logger.logifyAsync
  static mkdirp(filePath, callback) {
    mkdirp(filePath, callback);
  }

  @logger.logifyAsync
  static readdirSync(filePath) {
    return fs.readdirSync(filePath);
  }

  @logger.logifySync
  static existsSync(filePath) {
    return pathExists.sync(filePath);
  }

  @logger.logifyAsync
  static writeFile(filePath, fileContents, callback) {
    fs.writeFile(filePath, fileContents, callback);
  }

  @logger.logifySync
  static writeFileSync(filePath, fileContents) {
    fs.writeFileSync(filePath, fileContents);
  }

  @logger.logifySync
  static readFileSync(filePath) {
    return fs.readFileSync(filePath);
  }

  @logger.logifyAsync
  static rimraf(filePath, callback) {
    rimraf(filePath, callback);
  }
}
