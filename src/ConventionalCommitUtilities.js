"use strict";

const conventionalChangelogCore = require("conventional-changelog-core");
const conventionalRecommendedBump = require("conventional-recommended-bump");
const dedent = require("dedent");
const getStream = require("get-stream");
const log = require("npmlog");
const npa = require("npm-package-arg");
const path = require("path");
const semver = require("semver");

const FileSystemUtilities = require("./FileSystemUtilities");
const ValidationError = require("./utils/ValidationError");

const cfgCache = new Map();

function getChangelogConfig(changelogPreset = "conventional-changelog-angular") {
  let config = cfgCache.get(changelogPreset);

  if (!config) {
    let presetPackageName = changelogPreset;

    if (presetPackageName.indexOf("conventional-changelog-") < 0) {
      // https://github.com/npm/npm-package-arg#result-object
      const parsed = npa(presetPackageName);

      if (!parsed.name && parsed.raw[0] === "@") {
        // npa parses sub-path reference as a directory,
        // which results in an undefined "name" property
        throw new ValidationError(
          "ESCOPE",
          "A scoped conventional-changelog preset must use the full package name to reference subpaths"
        );
      }

      // implicit 'conventional-changelog-' prefix
      const parts = parsed.name.split("/");
      const start = parsed.scope ? 1 : 0;

      //        foo =>        conventional-changelog-foo
      // @scope/foo => @scope/conventional-changelog-foo
      parts.splice(start, 1, `conventional-changelog-${parts[start]}`);

      // _technically_ supports 'foo/lib/bar.js', but that's gross
      presetPackageName = parts.join("/");
    }

    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      config = require(presetPackageName);

      cfgCache.set(changelogPreset, config);
    } catch (err) {
      log.silly("getChangelogConfig", err);

      throw new ValidationError("EPRESET", `Unable to load conventional-commits preset '${changelogPreset}'`);
    }
  }

  // the core presets are bloody Q.all() spreads
  return Promise.resolve(config);
}

function recommendVersion(pkg, type, { changelogPreset }) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  const options = {
    path: pkg.location,
  };

  if (type === "independent") {
    options.lernaPackage = pkg.name;
  }

  return getChangelogConfig(changelogPreset).then(config => {
    // cc-core mutates input :P
    if (config.recommendedBumpOpts) {
      // "new" preset API
      options.config = config.recommendedBumpOpts;
    } else {
      // "old" preset API
      options.config = config;
    }

    return new Promise((resolve, reject) => {
      conventionalRecommendedBump(options, (err, data) => {
        if (err) {
          return reject(err);
        }

        log.verbose(type, "increment %s by %s", pkg.version, data.releaseType);
        resolve(semver.inc(pkg.version, data.releaseType));
      });
    });
  });
}

function makeBumpOnlyFilter(pkg) {
  return newEntry => {
    // When force publishing, it is possible that there will be no actual changes, only a version bump.
    // Add a note to indicate that only a version bump has occurred.
    if (!newEntry.split("\n").some(line => line.startsWith("*"))) {
      return dedent(`
        ${newEntry}

        **Note:** Version bump only for package ${pkg.name}
        `);
    }

    return newEntry;
  };
}

function readExistingChangelog({ location }) {
  const changelogFileLoc = path.join(location, "CHANGELOG.md");

  return FileSystemUtilities.readFile(changelogFileLoc)
    .catch(() => "") // allow missing file
    .then(changelogContents => {
      // CHANGELOG entries start with <a name=, we remove
      // the header if it exists by starting at the first entry.
      const firstEntryIndex = changelogContents.indexOf("<a name=");

      if (firstEntryIndex !== -1) {
        return changelogContents.substring(firstEntryIndex);
      }

      return changelogContents;
    })
    .then(changelogContents => [changelogFileLoc, changelogContents]);
}

function updateChangelog(pkg, type, { changelogPreset, version }) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  return getChangelogConfig(changelogPreset).then(config => {
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
      }
    }

    // generate the markdown for the upcoming release.
    const changelogStream = conventionalChangelogCore(options, context, gitRawCommitsOpts);

    return Promise.all([
      getStream(changelogStream).then(makeBumpOnlyFilter(pkg)),
      readExistingChangelog(pkg),
    ]).then(([newEntry, [changelogFileLoc, changelogContents]]) => {
      log.silly(type, "writing new entry: %j", newEntry);

      return FileSystemUtilities.writeFile(
        changelogFileLoc,
        dedent`
        # Change Log

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        ${newEntry}

        ${changelogContents}`
      ).then(() => {
        log.verbose(type, "wrote", changelogFileLoc);
        return changelogFileLoc;
      });
    });
  });
}

exports.getChangelogConfig = getChangelogConfig;
exports.recommendVersion = recommendVersion;
exports.updateChangelog = updateChangelog;
