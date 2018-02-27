"use strict";

const log = require("npmlog");
const path = require("path");

const ChildProcessUtilities = require("../ChildProcessUtilities");
const getExecOpts = require("./get-npm-exec-opts");

module.exports = npmPublish;

function npmPublish(tag, pkg, { npmClient, registry }) {
  const directory = pkg.location;

  log.silly("npmPublish", tag, path.basename(directory));

  const opts = getExecOpts(directory, registry);
  const args = ["publish", "--tag", tag.trim()];

  if (npmClient === "yarn") {
    // skip prompt for new version, use existing instead
    // https://yarnpkg.com/en/docs/cli/publish#toc-yarn-publish-new-version
    args.push("--new-version", pkg.version);
  }

  return ChildProcessUtilities.exec(npmClient, args, opts);
}
