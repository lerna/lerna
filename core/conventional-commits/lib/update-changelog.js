"use strict";

const conventionalChangelogCore = require("conventional-changelog-core");
const fs = require("fs-extra");
const getStream = require("get-stream");
const log = require("npmlog");
const { BLANK_LINE, CHANGELOG_HEADER, EOL } = require("./constants");
const getChangelogConfig = require("./get-changelog-config");
const makeBumpOnlyFilter = require("./make-bump-only-filter");
const readExistingChangelog = require("./read-existing-changelog");

module.exports = updateChangelog;

function updateChangelog(pkg, type, { changelogPreset, rootPath, tagPrefix, version }) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  return getChangelogConfig(changelogPreset, rootPath).then(config => {
    const options = {};
    let context; // pass as positional because cc-core's merge-config is wack

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
      context = { version };
    } else {
      // "fixed" or "independent"
      gitRawCommitsOpts.path = pkg.location;
      options.pkg = { path: pkg.manifestLocation };

      if (type === "independent") {
        options.lernaPackage = pkg.name;
      } else {
        // only fixed mode can have a custom tag prefix
        options.tagPrefix = tagPrefix;
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

        return {
          logPath: changelogFileLoc,
          newEntry,
        };
      });
    });
  });
}
