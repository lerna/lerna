import { colorize, type StyleFormat } from "@lerna/child-process";
import npmlog from "./npmlog";

const childProcess = require("@lerna/child-process");

interface UncommittedConfig {
  cwd: string;
  log?: typeof npmlog;
}

const maybeColorize = (format: StyleFormat) => (s: unknown) => s !== " " ? colorize(format, String(s)) : s;
const cRed = maybeColorize("red");
const cGreen = maybeColorize("green");

const replaceStatus = (_: any, maybeGreen: unknown, maybeRed: unknown) =>
  `${cGreen(maybeGreen)}${cRed(maybeRed)}`;

const colorizeStats = (stats: string) =>
  stats.replace(/^([^U]| )([A-Z]| )/gm, replaceStatus).replace(/^\?{2}|U{2}/gm, cRed("$&"));

const splitOnNewLine = (str: string) => str.split("\n");

const filterEmpty = (lines: string[]) => lines.filter((line) => line.length);

const o = (l: any, r: any) => (x: unknown) => l(r(x));

const transformOutput = o(filterEmpty, o(splitOnNewLine, colorizeStats));

export function collectUncommitted({ cwd, log = npmlog }: UncommittedConfig): Promise<string[]> {
  log.silly("collect-uncommitted", "git status --porcelain (async)");

  return (
    childProcess
      .exec("git", ["status", "--porcelain"], { cwd })
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .then(({ stdout }) => transformOutput(stdout))
  );
}

/**
 * Report uncommitted files. (sync)
 * @returns A list of uncommitted files
 */
export function collectUncommittedSync({ cwd, log = npmlog }: UncommittedConfig): string[] {
  log.silly("collect-uncommitted", "git status --porcelain (sync)");

  const stdout = childProcess.execSync("git", ["status", "--porcelain"], { cwd });
  return transformOutput(stdout);
}
