"use strict";

const log = require("npmlog");

const ChildProcessUtilities = require("@lerna/child-process");
const getExecOpts = require("@lerna/get-npm-exec-opts");
const logPacked = require("@lerna/log-packed");

module.exports = npmPublish;
module.exports.npmPack = npmPack;

function npmPublish(pkg, tag, { npmClient, registry }) {
  log.verbose("publish", pkg.name);

  const distTag = tag && tag.trim();
  const opts = getExecOpts({ location: pkg.rootPath }, registry);
  const args = ["publish", "--ignore-scripts"];

  if (distTag) {
    args.push("--tag", distTag);
  }

  if (npmClient === "yarn") {
    // skip prompt for new version, use existing instead
    // https://yarnpkg.com/en/docs/cli/publish#toc-yarn-publish-new-version
    args.push("--new-version", pkg.version, "--non-interactive");
  }

  // always add tarball file, created by npmPack()
  args.push(pkg.tarball);

  log.silly("exec", npmClient, args);
  return ChildProcessUtilities.exec(npmClient, args, opts);
}

function npmPack(rootManifest, packages) {
  // NOTE: All of the istanbul-ignored branches are covered in integration tests
  log.verbose("pack", packages.map(p => p.name));

  const opts = getExecOpts(rootManifest);
  const args = ["pack"].concat(packages.map(p => p.location));

  // let that juicy npm logging have its day in the sun
  opts.stdio = ["ignore", "pipe", "inherit"];

  // no need for fancy error wrapping
  delete opts.pkg;

  // always request JSON output for easier parsing of filenames
  args.push("--json");

  /* istanbul ignore if */
  if (process.env.LERNA_INTEGRATION) {
    // override process.env.npm_config_dry_run from integration tests
    args.push("--no-dry-run");
  }

  log.silly("exec", "npm", args);
  const proc = ChildProcessUtilities.exec("npm", args, opts);

  // --json output is an array of objects stringified with 2-space indent
  const jsonStart = /^\[\n[ ]{2}{\n[ ]{4}/;

  let jsonBegan = false;
  let jsonString = "";

  // npm-lifecycle log note should be removed when --loglevel=silent
  // we cannot pass --silent because it also hides --json
  const isNote = /^\n> /;
  /* istanbul ignore next */
  const output =
    log.level !== "silent"
      ? chunk => process.stdout.write(chunk)
      : chunk => !isNote.test(chunk) && process.stdout.write(chunk);

  // only pipe script output instead of inheriting stdout
  // stop piping when we reach the start of --json output
  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", chunk => {
    /* istanbul ignore else */
    if (jsonBegan) {
      // it could be larger than a single chunk
      jsonString += chunk;
    } else if (jsonStart.test(chunk)) {
      // the first json chunk (commonly the only one)
      jsonString += chunk;
      // stop writing output to stdout
      jsonBegan = true;
    } else {
      // maybe write non-json chunk to stdout
      output(chunk);
    }
  });

  return proc.then(() => {
    const tarballs = JSON.parse(jsonString);

    tarballs.forEach(logPacked);

    // npm pack --json list is in the same order as the packages input
    for (let i = 0; i < packages.length; i += 1) {
      const pkg = packages[i];
      // instead of complicated copypasta, use literally what npm did
      pkg.tarball = tarballs[i].filename;
    }

    return proc;
  });
}
