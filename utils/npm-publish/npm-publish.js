"use strict";

const fs = require("fs-extra");
const log = require("libnpm/log");
const path = require("path");

const ChildProcessUtilities = require("@lerna/child-process");
const getExecOpts = require("@lerna/get-npm-exec-opts");

module.exports = npmPublish;

function npmPublish(pkg, tag, { npmClient, registry }) {
  log.verbose("publish", pkg.name);

  const distTag = tag && tag.trim();
  const opts = getExecOpts(pkg, registry);
  const args = ["publish", "--ignore-scripts"];

  if (distTag) {
    args.push("--tag", distTag);
  }

  if (npmClient === "yarn") {
    // skip prompt for new version, use existing instead
    // https://yarnpkg.com/en/docs/cli/publish#toc-yarn-publish-new-version
    args.push("--new-version", pkg.version, "--non-interactive", "--no-git-tag-version");
    // yarn also needs to be told to stop creating git tags: https://git.io/fAr1P
  }

  // always add tarball file, created by npmPack()
  args.push(pkg.tarball.filename);

  log.silly("exec", npmClient, args);
  return ChildProcessUtilities.exec(npmClient, args, opts).then(() =>
    // don't leave the generated tarball hanging around after success
    fs.remove(path.join(pkg.location, pkg.tarball.filename)).then(() => pkg)
  );
}
