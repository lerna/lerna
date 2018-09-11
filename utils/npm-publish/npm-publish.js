"use strict";

const fs = require("fs-extra");
const log = require("npmlog");
const path = require("path");
const pMap = require("p-map");

const ChildProcessUtilities = require("@lerna/child-process");
const getExecOpts = require("@lerna/get-npm-exec-opts");
const hasNpmVersion = require("@lerna/has-npm-version");
const logPacked = require("@lerna/log-packed");

module.exports = npmPublish;
module.exports.npmPack = npmPack;
module.exports.makePacker = makePacker;

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

function makePackOptions(rootManifest) {
  const opts = getExecOpts(rootManifest);

  // let that juicy npm logging have its day in the sun
  opts.stdio = ["ignore", "pipe", "inherit"];

  // no need for fancy error wrapping
  delete opts.pkg;

  if (hasNpmVersion(">=5.10.0")) {
    // request JSON output for easier parsing of filenames
    opts.env.npm_config_json = true;
  }

  /* istanbul ignore if */
  if (process.env.LERNA_INTEGRATION) {
    // override process.env.npm_config_dry_run from integration tests
    opts.env.npm_config_dry_run = false;
  }

  log.silly("exec", "npm options", opts);
  return opts;
}

function npmPack(rootManifest, packages, opts = makePackOptions(rootManifest)) {
  // NOTE: All of the istanbul-ignored branches are covered in integration tests
  log.verbose("pack", packages.map(p => p.name));

  const args = ["pack"].concat(packages.map(p => p.location));

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
      log.pause();
      output(chunk);
      log.resume();
    }
  });

  return proc.then(result => {
    const tarballs = jsonString ? JSON.parse(jsonString) : parseLegacyTarballs(result, packages);

    tarballs.forEach(logPacked);

    // npm pack --json list is in the same order as the packages input
    for (let i = 0; i < packages.length; i += 1) {
      // could do this inside the mapper, but we need this metadata regardless of p-map success
      const pkg = packages[i];

      // instead of complicated copypasta, use literally what npm did
      pkg.tarball = tarballs[i];
    }

    return pMap(
      packages,
      pkg => {
        const inRoot = path.join(pkg.rootPath, pkg.tarball.filename);
        const toLeaf = path.join(pkg.location, pkg.tarball.filename);

        return fs.move(inRoot, toLeaf, { overwrite: true }).then(() => pkg);
      },
      { concurrency: 10 }
    );
  });
}

function makePacker(rootManifest) {
  const opts = makePackOptions(rootManifest);

  return packages => npmPack(rootManifest, packages, opts);
}

function parseLegacyTarballs(result, packages) {
  // legacy `npm pack` outputs the generated tarball names
  // at the end of stdout in the order of package input(s)
  const isTgz = /^[\S]+\.tgz$/;
  const lines = result.stdout.split("\n");
  const files = lines.filter(line => isTgz.test(line));

  // each result is passed to log-packed, so it needs decoration
  return files.map((filename, idx) => {
    const pkg = packages[idx];

    return {
      // the important part
      filename,
      // make log-packed show _something_ useful
      name: pkg.name,
      version: pkg.version,
    };
  });
}
