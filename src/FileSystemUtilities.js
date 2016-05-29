import pathExists from "path-exists";
import logger from "./logger";
import mkdirp from "mkdirp";
import rimraf from "rimraf";
import fs from "fs";

var ENDS_WITH_NEW_LINE = /\n$/;

function ensureEndsWithNewLine(string) {
  return ENDS_WITH_NEW_LINE.test(string) ? string : string + "\n";
}

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
    fs.writeFile(filePath, ensureEndsWithNewLine(fileContents), callback);
  }

  @logger.logifySync
  static writeFileSync(filePath, fileContents) {
    fs.writeFileSync(filePath, ensureEndsWithNewLine(fileContents));
  }

  @logger.logifySync
  static readFileSync(filePath) {
    return fs.readFileSync(filePath, "utf-8").toString().trim();
  }

  @logger.logifyAsync
  static rimraf(filePath, callback) {
    rimraf(filePath, callback);
  }

  @logger.logifySync
  static unlinkSync(filePath) {
    fs.unlink(filePath);
  }
}
