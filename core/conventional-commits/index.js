"use strict";

const conventionalChangelogCore = require("conventional-changelog-core");
const conventionalRecommendedBump = require("conventional-recommended-bump");
const dedent = require("dedent");
const fs = require("fs-extra");
const getStream = require("get-stream");
const log = require("npmlog");
const npa = require("npm-package-arg");
const os = require("os");
const path = require("path");
const semver = require("semver");

const ValidationError = require("@lerna/validation-error");

const BLANK_LINE = os.EOL + os.EOL;
const CHANGELOG_HEADER = dedent`
  # Change Log

  All notable changes to this project will be documented in this file.
  See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.
`;

const cfgCache = new Map();

function getChangelogConfig(changelogPreset = "conventional-changelog-angular", rootPath) {
  let config = cfgCache.get(changelogPreset);

  if (!config) {
    let presetPackageName = changelogPreset;

    // https://github.com/npm/npm-package-arg#result-object
    const parsed = npa(presetPackageName, rootPath);

    if (parsed.type === "directory") {
      if (parsed.raw[0] === "@") {
        // npa parses scoped subpath reference as a directory
        parsed.name = parsed.raw;
        parsed.scope = parsed.raw.substring(0, parsed.raw.indexOf("/"));
        // un-scoped subpath shorthand handled in first catch block
      } else {
        presetPackageName = parsed.fetchSpec;
      }
    } else if (parsed.type === "git" && parsed.hosted && parsed.hosted.default === "shortcut") {
      // probably a shorthand subpath, e.g. "foo/bar"
      parsed.name = parsed.raw;
    }

    // Maybe it doesn't need an implicit 'conventional-changelog-' prefix?
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      config = require(presetPackageName);

      cfgCache.set(changelogPreset, config);

      // early exit, yay
      return Promise.resolve(config);
    } catch (err) {
      log.verbose("getChangelogConfig", err.message);
      log.info("getChangelogConfig", `Auto-prefixing conventional-commits preset '${changelogPreset}'`);

      // probably a deep shorthand subpath :P
      parsed.name = parsed.raw;
    }

    if (parsed.name.indexOf("conventional-changelog-") < 0) {
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
      log.warn("getChangelogConfig", err.message);

      throw new ValidationError(
        "EPRESET",
        `Unable to load conventional-commits preset '${changelogPreset}'${
          changelogPreset !== presetPackageName ? ` (${presetPackageName})` : ""
        }`
      );
    }
  }

  // the core presets are bloody Q.all() spreads
  return Promise.resolve(config);
}

function recommendVersion(pkg, type, { changelogPreset, rootPath }) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  const options = {
    path: pkg.location,
  };

  if (type === "independent") {
    options.lernaPackage = pkg.name;
  }

  return getChangelogConfig(changelogPreset, rootPath).then(config => {
    // "new" preset API
    options.config = config;

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
    if (!newEntry.split("\n").some(line => line.startsWith("*"))) {
      // Add a note to indicate that only a version bump has occurred.
      // TODO: actually list the dependencies that were bumped
      const message = `**Note:** Version bump only for package ${pkg.name}`;

      // the extra blank lines preserve the whitespace delimiting releases
      return [newEntry.trim(), message, BLANK_LINE].join(BLANK_LINE);
    }

    return newEntry;
  };
}

function readExistingChangelog({ location }) {
  const changelogFileLoc = path.join(location, "CHANGELOG.md");

  return Promise.resolve()
    .then(() => fs.readFile(changelogFileLoc, "utf8"))
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

function updateChangelog(pkg, type, { changelogPreset, rootPath, version }) {
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

      return fs.writeFile(changelogFileLoc, content.trim() + os.EOL).then(() => {
        log.verbose(type, "wrote", changelogFileLoc);

        return changelogFileLoc;
      });
    });
  });
}

exports.recommendVersion = recommendVersion;
exports.updateChangelog = updateChangelog;
