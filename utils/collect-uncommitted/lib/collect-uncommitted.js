"use strict";

const chalk = require("chalk");
const npmlog = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports.collectUncommitted = collectUncommitted;
module.exports.collectUncommittedSync = collectUncommittedSync;

/**
 * @typedef {object} UncommittedConfig
 * @property {string} cwd
 * @property {typeof npmlog} [log]
 */

const maybeColorize = (colorize) => (s) => (s !== " " ? colorize(s) : s);
const cRed = maybeColorize(chalk.red);
const cGreen = maybeColorize(chalk.green);

const replaceStatus = (_, maybeGreen, maybeRed) => `${cGreen(maybeGreen)}${cRed(maybeRed)}`;

const colorizeStats = (stats) =>
  stats.replace(/^([^U]| )([A-Z]| )/gm, replaceStatus).replace(/^\?{2}|U{2}/gm, cRed("$&"));

const splitOnNewLine = (str) => str.split("\n");

const filterEmpty = (lines) => lines.filter((line) => line.length);

const o = (l, r) => (x) => l(r(x));

const transformOutput = o(filterEmpty, o(splitOnNewLine, colorizeStats));

/**
 * Report uncommitted files. (async)
 * @param {UncommittedConfig} options
 * @returns {Promise<string[]>} A list of uncommitted files
 */
function collectUncommitted({ cwd, log = npmlog }) {
  log.silly("collect-uncommitted", "git status --porcelain (async)");

  return childProcess
    .exec("git", ["status", "--porcelain"], { cwd })
    .then(({ stdout }) => transformOutput(stdout));
}

/**
 * Report uncommitted files. (sync)
 * @param {UncommittedConfig} options
 * @returns {string[]} A list of uncommitted files
 */
function collectUncommittedSync({ cwd, log = npmlog }) {
  log.silly("collect-uncommitted", "git status --porcelain (sync)");

  const stdout = childProcess.execSync("git", ["status", "--porcelain"], { cwd });
  return transformOutput(stdout);
}
