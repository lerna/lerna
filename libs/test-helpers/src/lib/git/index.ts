// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { tempWrite } from "@lerna/core";
import cp from "child_process";
import execa from "execa";
import loadJsonFile from "load-json-file";
import os from "os";
import path from "path";
import { writeJsonFile } from "@nrwl/devkit";
import { gitSHASerializer } from "../serializers";

// Contains all relevant git config (user, commit.gpgSign, etc)
const TEMPLATE = path.resolve(__dirname, "template");

export function getCommitMessage(cwd: string, format = "%B") {
  return execa("git", ["log", "-1", `--pretty=format:${format}`], { cwd }).then((result) => result.stdout);
}

export function gitAdd(cwd: string, ...files: string[]) {
  return execa("git", ["add", ...files], { cwd });
}

export function gitCheckout(cwd: string, args: any) {
  return execa("git", ["checkout", ...args], { cwd });
}

export function gitCommit(cwd: string, message: string) {
  if (message.indexOf(os.EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    return tempWrite(message).then((fp: string) => execa("git", ["commit", "-F", fp], { cwd }));
  }

  return execa("git", ["commit", "-m", message], { cwd });
}

export function gitInit(cwd: string, ...args: any[]) {
  return execa("git", ["init", "--template", TEMPLATE, ...args], { cwd }).then(() =>
    execa("git", ["checkout", "-B", "main"], { cwd })
  );
}

export function gitMerge(cwd: string, args: any) {
  return execa("git", ["merge", ...args], { cwd });
}

export function gitStatus(cwd?: string) {
  return cp.spawnSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" });
}

export function gitTag(cwd: string, tagName: string) {
  return execa("git", ["tag", tagName, "-m", tagName], { cwd });
}

export function showCommit(cwd: string, ...args: any[]) {
  return execa(
    "git",
    [
      "show",
      "--unified=0",
      "--ignore-space-at-eol",
      "--pretty=%B%+D",
      // make absolutely certain that no OS localization
      // changes the expected value of the path prefixes
      "--src-prefix=a/",
      "--dst-prefix=b/",
      ...args,
    ],
    { cwd }
  ).then((result) => gitSHASerializer.serialize(result.stdout));
}

export function commitChangeToPackage(cwd: string, packageName: string, commitMsg: any, data: any) {
  const packageJSONPath = path.join(cwd, "packages", packageName, "package.json");

  // QQ no async/await yet...
  let chain = Promise.resolve();

  chain = chain.then(() => loadJsonFile(packageJSONPath));
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then((pkg) => writeJsonFile(packageJSONPath, Object.assign(pkg, data)));
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then(() => gitAdd(cwd, packageJSONPath));
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then(() => gitCommit(cwd, commitMsg));

  return chain;
}
