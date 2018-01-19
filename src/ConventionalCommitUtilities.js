"use strict";

const dedent = require("dedent");
const log = require("npmlog");
const path = require("path");
const semver = require("semver");

const ChildProcessUtilities = require("./ChildProcessUtilities");
const FileSystemUtilities = require("./FileSystemUtilities");

const CHANGELOG_NAME = "CHANGELOG.md";
const CHANGELOG_HEADER = dedent(`# Change Log

  All notable changes to this project will be documented in this file.
  See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.`);

// We call these resolved CLI files in the "path/to/node path/to/cli <..args>"
// pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
const RECOMMEND_CLI = require.resolve("conventional-recommended-bump/cli");
const CHANGELOG_CLI = require.resolve("conventional-changelog-cli/cli");

function recommendIndependentVersion(pkg, opts) {
  // `-p` here is overridden because `conventional-recommended-bump`
  // cannot accept custom preset.
  const args = [RECOMMEND_CLI, "-l", pkg.name, "--commit-path", pkg.location, "-p", "angular"];
  return exports.recommendVersion(pkg, opts, "recommendIndependentVersion", args);
}

function recommendFixedVersion(pkg, opts) {
  // `-p` here is overridden because `conventional-recommended-bump`
  // cannot accept custom preset.
  const args = [RECOMMEND_CLI, "--commit-path", pkg.location, "-p", "angular"];
  return exports.recommendVersion(pkg, opts, "recommendFixedVersion", args);
}

function recommendVersion(pkg, opts, type, args) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  const recommendedBump = ChildProcessUtilities.execSync(process.execPath, args, opts);

  log.verbose(type, "increment %s by %s", pkg.version, recommendedBump);
  return semver.inc(pkg.version, recommendedBump);
}

function updateIndependentChangelog(pkg, opts) {
  const pkgJsonLocation = path.join(pkg.location, "package.json");
  const args = [
    CHANGELOG_CLI,
    "-l",
    pkg.name,
    "--commit-path",
    pkg.location,
    "--pkg",
    pkgJsonLocation,
    "-p",
    exports.changelogPreset(opts),
  ];
  exports.updateChangelog(pkg, opts, "updateIndependentChangelog", args);
}

function updateFixedChangelog(pkg, opts) {
  const pkgJsonLocation = path.join(pkg.location, "package.json");
  const args = [
    CHANGELOG_CLI,
    "--commit-path",
    pkg.location,
    "--pkg",
    pkgJsonLocation,
    "-p",
    exports.changelogPreset(opts),
  ];
  exports.updateChangelog(pkg, opts, "updateFixedChangelog", args);
}

function updateFixedRootChangelog(pkg, opts) {
  const args = [
    CHANGELOG_CLI,
    "-p",
    exports.changelogPreset(opts),
    "--context",
    path.resolve(__dirname, "ConventionalChangelogContext.js"),
  ];
  exports.updateChangelog(pkg, opts, "updateFixedRootChangelog", args);
}

function updateChangelog(pkg, opts, type, args) {
  log.silly(type, "for %s at %s", pkg.name, pkg.location);

  const changelogFileLoc = exports.changelogLocation(pkg);

  let changelogContents = "";
  if (FileSystemUtilities.existsSync(changelogFileLoc)) {
    changelogContents = FileSystemUtilities.readFileSync(changelogFileLoc);
  }

  // run conventional-changelog-cli to generate the markdown for the upcoming release.
  let newEntry = ChildProcessUtilities.execSync(process.execPath, args, opts);

  // When force publishing, it is possible that there will be no actual changes, only a version bump.
  // Add a note to indicate that only a version bump has occurred.
  if (!newEntry.split("\n").some(line => line.startsWith("*"))) {
    newEntry = dedent(
      `
        ${newEntry}

        **Note:** Version bump only for package ${pkg.name}
        `
    );
  }

  log.silly(type, "writing new entry: %j", newEntry);

  // CHANGELOG entries start with <a name=, we remove
  // the header if it exists by starting at the first entry.
  if (changelogContents.indexOf("<a name=") !== -1) {
    changelogContents = changelogContents.substring(changelogContents.indexOf("<a name="));
  }

  FileSystemUtilities.writeFileSync(
    changelogFileLoc,
    // only allow 1 \n at end of content.
    dedent(
      `${CHANGELOG_HEADER}

        ${newEntry}

        ${changelogContents}`.replace(/\n+$/, "\n")
    )
  );

  log.verbose(type, "wrote", changelogFileLoc);
}

function changelogLocation(pkg) {
  return path.join(pkg.location, CHANGELOG_NAME);
}

function changelogPreset(opts) {
  return opts && opts.changelogPreset ? opts.changelogPreset : "angular";
}

exports.recommendIndependentVersion = recommendIndependentVersion;
exports.recommendFixedVersion = recommendFixedVersion;
exports.recommendVersion = recommendVersion;
exports.updateIndependentChangelog = updateIndependentChangelog;
exports.updateFixedChangelog = updateFixedChangelog;
exports.updateFixedRootChangelog = updateFixedRootChangelog;
exports.updateChangelog = updateChangelog;
exports.changelogLocation = changelogLocation;
exports.changelogPreset = changelogPreset;
