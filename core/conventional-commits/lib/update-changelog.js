"use strict";

const conventionalChangelogCore = require("conventional-changelog-core");
const fs = require("fs-extra");
const getStream = require("get-stream");
const log = require("npmlog");
const { spawn } = require("child_process");
const { BLANK_LINE, CHANGELOG_HEADER, EOL } = require("./constants");
const getChangelogConfig = require("./get-changelog-config");
const makeBumpOnlyFilter = require("./make-bump-only-filter");
const readExistingChangelog = require("./read-existing-changelog");

module.exports = updateChangelog;

function updateChangelog(pkg, type, { changelogPreset, rootPath, tagPrefix = "v", version }) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  return getChangelogConfig(changelogPreset, rootPath).then(config => {
    const options = {};
    const context = {}; // pass as positional because cc-core's merge-config is wack

    // cc-core mutates input :P
    if (config.conventionalChangelog) {
      // "new" preset API
      options.config = Object.assign({}, config.conventionalChangelog);
    } else {
      // "old" preset API
      options.config = Object.assign({}, config);
    }

    // NOTE: must pass as positional argument due to weird bug in merge-config
    const gitRawCommitsOpts = Object.assign({}, options.config.gitRawCommitsOpts);

    if (type === "root") {
      context.version = version;

      // preserve tagPrefix because cc-core can't find the currentTag otherwise
      context.currentTag = `${tagPrefix}${version}`;

      // root changelogs are only enabled in fixed mode, and need the proper tag prefix
      options.tagPrefix = tagPrefix;
    } else {
      // "fixed" or "independent"
      gitRawCommitsOpts.path = pkg.location;
      options.pkg = { path: pkg.manifestLocation };

      if (type === "independent") {
        options.lernaPackage = pkg.name;
      } else {
        // only fixed mode can have a custom tag prefix
        options.tagPrefix = tagPrefix;

        // preserve tagPrefix because cc-core can't find the currentTag otherwise
        context.currentTag = `${tagPrefix}${pkg.version}`;
      }
    }

    // generate the markdown for the upcoming release.
    const changelogStream = conventionalChangelogCore(options, context, gitRawCommitsOpts);

    return Promise.all([
      getStream(changelogStream).then(makeBumpOnlyFilter(pkg)),
      readExistingChangelog(pkg),
    ]).then(([newEntry, [changelogFileLoc, changelogContents]]) => {
      log.silly(type, "writing new entry: %j", newEntry);

      const content = [CHANGELOG_HEADER, newEntry, changelogContents].join(BLANK_LINE);

      return fs.writeFile(changelogFileLoc, content.trim() + EOL).then(() => {
        log.verbose(type, "wrote", changelogFileLoc);
        return new Promise((resolve, reject) => {
          const vim = spawn("vim", [changelogFileLoc], { stdio: "inherit" });
          vim.on("exit", () => {
            return resolve({
              logPath: changelogFileLoc,
              newEntry,
            });
          });
          vim.on("error", err => {
            return reject(err);
          });
        });
      });
    });
  });
}
