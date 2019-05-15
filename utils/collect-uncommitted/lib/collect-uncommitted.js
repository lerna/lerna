"use strict";

const chalk = require("chalk");
const figgyPudding = require("figgy-pudding");
const npmlog = require("npmlog");
const { exec, execSync } = require("@lerna/child-process");

module.exports = collectUncommitted;
module.exports.sync = sync;

const UncommittedConfig = figgyPudding({
  cwd: {},
  log: { default: npmlog },
});

const maybeColorize = colorize => s => (s !== " " ? colorize(s) : s);
const cRed = maybeColorize(chalk.red);
const cGreen = maybeColorize(chalk.green);

const replaceStatus = (_, maybeGreen, maybeRed) => `${cGreen(maybeGreen)}${cRed(maybeRed)}`;

const colorizeStats = stats =>
  stats.replace(/^([^U]| )([A-Z]| )/gm, replaceStatus).replace(/^\?{2}|U{2}/gm, cRed("$&"));

const splitOnNewLine = str => str.split("\n");

const filterEmpty = lines => lines.filter(line => line.length);

const o = (l, r) => x => l(r(x));

const transformOutput = o(filterEmpty, o(splitOnNewLine, colorizeStats));

function collectUncommitted(options) {
  const { cwd, log } = UncommittedConfig(options);
  log.silly("collect-uncommitted", "git status --porcelain (async)");

  return exec("git", ["status", "--porcelain"], { cwd }).then(({ stdout }) => transformOutput(stdout));
}

function sync(options) {
  const { cwd, log } = UncommittedConfig(options);
  log.silly("collect-uncommitted", "git status --porcelain (sync)");

  const stdout = execSync("git", ["status", "--porcelain"], { cwd });
  return transformOutput(stdout);
}
