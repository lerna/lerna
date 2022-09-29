"use strict";

const fs = require("fs");
const log = require("npmlog");
const path = require("path");
const slash = require("slash");
const { workspaceRoot } = require("@nrwl/devkit");
const childProcess = require("@lerna/child-process");

module.exports.gitAdd = gitAdd;

let resolvedPrettier;
function resolvePrettier() {
  if (!resolvedPrettier) {
    try {
      // If the workspace has prettier installed, apply it to the updated files
      const prettierPath = path.join(workspaceRoot, "node_modules", "prettier");
      // eslint-disable-next-line import/no-dynamic-require, global-require
      resolvedPrettier = require(prettierPath);
    } catch {
      return;
    }
  }
  return resolvedPrettier;
}

function maybeFormatFile(filePath) {
  const prettier = resolvePrettier();
  if (!prettier) {
    return;
  }
  const config = resolvedPrettier.resolveConfig.sync(filePath);
  try {
    const input = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(filePath, resolvedPrettier.format(input, { ...config, filepath: filePath }), "utf8");
    log.silly("version", `Successfully applied prettier to updated file: ${filePath}`);
  } catch {
    log.silly("version", `Failed to apply prettier to updated file: ${filePath}`);
  }
}

/**
 * @param {string[]} changedFiles
 * @param {{ granularPathspec: boolean; }} gitOpts
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 */
function gitAdd(changedFiles, gitOpts, execOpts) {
  let files = [];
  for (const file of changedFiles) {
    const filePath = slash(path.relative(execOpts.cwd, path.resolve(execOpts.cwd, file)));
    maybeFormatFile(filePath);
    if (gitOpts.granularPathspec) {
      files.push(filePath);
    }
  }

  // granular pathspecs should be relative to the git root, but that isn't necessarily where lerna lives
  if (!gitOpts.granularPathspec) {
    files = ".";
  }

  log.silly("gitAdd", files);

  return childProcess.exec("git", ["add", "--", ...files], execOpts);
}
