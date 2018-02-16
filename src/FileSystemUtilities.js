"use strict";

const fs = require("fs-extra");
const log = require("npmlog");
const path = require("path");
const pathExists = require("path-exists");

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

function existsSync(filePath) {
  log.silly("existsSync", filePath);
  return pathExists.sync(filePath);
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

function rename(from, to, callback) {
  log.silly("rename", [from, to]);
  fs.rename(from, to, callback);
}

function renameSync(from, to) {
  log.silly("renameSync", [from, to]);
  fs.renameSync(from, to);
}

function writeFile(filePath, fileContents, callback) {
  log.silly("writeFile", [filePath, fileContents]);
  return fs.writeFile(filePath, ensureEndsWithNewLine(fileContents), callback);
}

function writeFileSync(filePath, fileContents) {
  log.silly("writeFileSync", [filePath, fileContents]);
  fs.writeFileSync(filePath, ensureEndsWithNewLine(fileContents));
}

function readFile(filePath) {
  log.silly("readFile", filePath);
  return fs.readFile(filePath, "utf8").then(content => content.trim());
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

function unlinkSync(filePath) {
  log.silly("unlinkSync", filePath);
  fs.unlinkSync(filePath);
}

exports.chmod = chmod;
exports.chmodSync = chmodSync;
exports.existsSync = existsSync;
exports.mkdirp = mkdirp;
exports.mkdirpSync = mkdirpSync;
exports.readdirSync = readdirSync;
exports.rename = rename;
exports.renameSync = renameSync;
exports.writeFile = writeFile;
exports.writeFileSync = writeFileSync;
exports.readFile = readFile;
exports.readFileSync = readFileSync;
exports.statSync = statSync;
exports.rimraf = rimraf;
exports.unlinkSync = unlinkSync;
