"use strict";

const execa = require("execa");
const os = require("os");
const tempWrite = require("@lerna/temp-write");
const path = require("path");
const cp = require("child_process");
const loadJsonFile = require("load-json-file");
const writeJsonFile = require("write-json-file");
const gitSHA = require("../serializers/serialize-git-sha");

// Contains all relevant git config (user, commit.gpgSign, etc)
const TEMPLATE = path.resolve(__dirname, "template");

exports.getCommitMessage = function getCommitMessage(cwd, format = "%B") {
  return execa("git", ["log", "-1", `--pretty=format:${format}`], { cwd }).then((result) => result.stdout);
};

function gitAdd(cwd, ...files) {
  return execa("git", ["add", ...files], { cwd });
}
exports.gitAdd = gitAdd;

exports.gitCheckout = function gitCheckout(cwd, args) {
  return execa("git", ["checkout", ...args], { cwd });
};

function gitCommit(cwd, message) {
  if (message.indexOf(os.EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    return tempWrite(message).then((fp) => execa("git", ["commit", "-F", fp], { cwd }));
  }

  return execa("git", ["commit", "-m", message], { cwd });
}
exports.gitCommit = gitCommit;

exports.gitInit = function gitInit(cwd, ...args) {
  return execa("git", ["init", "--template", TEMPLATE, ...args], { cwd }).then(() =>
    execa("git", ["checkout", "-B", "main"], { cwd })
  );
};

exports.gitMerge = function gitMerge(cwd, args) {
  return execa("git", ["merge", ...args], { cwd });
};

exports.gitStatus = function gitStatus(cwd) {
  return cp.spawnSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" });
};

exports.gitTag = function gitTag(cwd, tagName) {
  return execa("git", ["tag", tagName, "-m", tagName], { cwd });
};

exports.showCommit = function showCommit(cwd, ...args) {
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
  ).then((result) => gitSHA.serialize(result.stdout));
};

exports.commitChangeToPackage = function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = path.join(cwd, "packages", packageName, "package.json");

  // QQ no async/await yet...
  let chain = Promise.resolve();

  chain = chain.then(() => loadJsonFile(packageJSONPath));
  chain = chain.then((pkg) => writeJsonFile(packageJSONPath, Object.assign(pkg, data)));
  chain = chain.then(() => gitAdd(cwd, packageJSONPath));
  chain = chain.then(() => gitCommit(cwd, commitMsg));

  return chain;
};
