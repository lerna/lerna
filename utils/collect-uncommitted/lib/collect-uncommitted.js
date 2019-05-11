"use strict";

const chalk = require("chalk");
const { exec, execSync } = require("@lerna/child-process");

module.exports = collectUncommitted;
module.exports.sync = sync;

const maybeColorize = colorize => s => (s !== " " ? colorize(s) : s);
const cRed = maybeColorize(chalk.red);
const cGreen = maybeColorize(chalk.green);

const replaceStatus = (_, maybeGreen, maybeRed) => `${cGreen(maybeGreen)}${cRed(maybeRed)}`;

const colorizeStats = stats =>
  stats.replace(/^([^U]| )([A-Z]| )/gm, replaceStatus).replace(/^\?{2}|U{2}/gm, cRed("$&"));

const splitOnNewLine = (string = "") => string.split("\n");

const filterEmpty = (strings = []) => strings.filter(s => s.length !== 0);

const o = (l, r) => x => l(r(x));

const transformOutput = o(filterEmpty, o(splitOnNewLine, colorizeStats));

function collectUncommitted(options = {}) {
  return exec("git", "status -s", options).then(transformOutput);
}

function sync(options = {}) {
  const stdout = execSync("git", "status -s", options);
  return transformOutput(stdout);
}
