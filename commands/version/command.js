"use strict";

const log = require("npmlog");
const semver = require("semver");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "version [bump]";

exports.describe = "Bump version of packages changed since the last release.";

exports.builder = (yargs, composed) => {
  const opts = {
    "allow-branch": {
      describe: "Specify which branches to allow versioning from.",
      type: "array",
    },
    amend: {
      describe: "Amend the existing commit, instead of generating a new one.",
      type: "boolean",
    },
    "commit-hooks": {
      describe: "Run git commit hooks when committing the version changes.",
      type: "boolean",
      defaultDescription: "true",
    },
    "conventional-commits": {
      describe: "Use angular conventional-commit format to determine version bump and generate CHANGELOG.",
      type: "boolean",
    },
    "changelog-preset": {
      describe: "Use another conventional-changelog preset rather than angular.",
      type: "string",
    },
    exact: {
      describe: "Specify cross-dependency version numbers exactly rather than with a caret (^).",
      type: "boolean",
    },
    "git-remote": {
      describe: "Push git changes to the specified remote instead of 'origin'.",
      type: "string",
      requiresArg: true,
      defaultDescription: "origin",
    },
    "git-tag-version": {
      describe: "Commit and tag the version changes.",
      type: "boolean",
      defaultDescription: "true",
    },
    "ignore-changes": {
      describe: "Ignore changes in files matched by glob(s) when detecting changed packages.",
      type: "array",
    },
    m: {
      describe: "Use a custom commit message when creating the version commit.",
      alias: "message",
      type: "string",
      requiresArg: true,
    },
    // preid is copied into ../publish/command because a whitelist for one option isn't worth it
    preid: {
      describe: "Specify the prerelease identifier when versioning a prerelease",
      type: "string",
      requiresArg: true,
      defaultDescription: "alpha",
    },
    push: {
      describe: "Push tagged commit to git remote.\nPass --no-push to disable.",
      type: "boolean",
      defaultDescription: "true",
    },
    "sign-git-commit": {
      describe: "Pass the `--gpg-sign` flag to `git commit`.",
      type: "boolean",
    },
    "sign-git-tag": {
      describe: "Pass the `--sign` flag to `git tag`.",
      type: "boolean",
    },
    "tag-version-prefix": {
      describe: "Customize the tag prefix. To remove entirely, pass an empty string.",
      type: "string",
      requiresArg: true,
      defaultDescription: "v",
    },
    y: {
      describe: "Skip all confirmation prompts.",
      alias: "yes",
      type: "boolean",
    },
  };

  if (composed) {
    // hide options from composed command's help output
    Object.keys(opts).forEach(key => {
      opts[key].hidden = true;
    });

    // set argv.composed for wrapped execution logic
    yargs.default("composed", composed).hide("composed");
  } else {
    exports.addBumpPositional(yargs);
  }

  yargs.options(opts);

  if (!composed) {
    // hide options from composed command's help output
    yargs.group(Object.keys(opts), "Command Options:");
  }

  return yargs
    .option("ignore", {
      // TODO: remove in next major release
      // NOT the same as filter-options --ignore
      hidden: true,
      conflicts: "ignore-changes",
      type: "array",
    })
    .option("cd-version", {
      // TODO: remove in next major release
      hidden: true,
      conflicts: "bump",
      type: "string",
      requiresArg: true,
    })
    .option("repo-version", {
      // TODO: remove in next major release
      hidden: true,
      conflicts: "bump",
      type: "string",
      requiresArg: true,
    })
    .option("skip-git", {
      // TODO: remove in next major release
      hidden: true,
      type: "boolean",
    })
    .check(argv => {
      /* eslint-disable no-param-reassign */
      if (argv.ignore) {
        argv.ignoreChanges = argv.ignore;
        delete argv.ignore;
        log.warn("deprecated", "--ignore has been renamed --ignore-changes");
      }

      if (argv.cdVersion && !argv.bump) {
        argv.bump = argv.cdVersion;
        delete argv.cdVersion;
        delete argv["cd-version"];
        log.warn("deprecated", "--cd-version has been replaced by positional [bump]");
      }

      if (argv.repoVersion && !argv.bump) {
        argv.bump = argv.repoVersion;
        delete argv.repoVersion;
        delete argv["repo-version"];
        log.warn("deprecated", "--repo-version has been replaced by positional [bump]");
      }

      if (argv.skipGit) {
        argv.gitTagVersion = false;
        argv["git-tag-version"] = false;
        argv.push = false;
        delete argv.skipGit;
        delete argv["skip-git"];
        log.warn("deprecated", "--skip-git has been replaced by --no-git-tag-version --no-push");
      }
      /* eslint-enable no-param-reassign */

      return argv;
    });
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};

exports.addBumpPositional = function addBumpPositional(yargs, additionalKeywords = []) {
  const semverKeywords = ["major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease"].concat(
    additionalKeywords
  );
  const bumpOptionList = `'${semverKeywords.slice(0, -1).join("', '")}', or '${
    semverKeywords[semverKeywords.length - 1]
  }'.`;

  yargs.positional("bump", {
    describe: `Increment version(s) by explicit version _or_ semver keyword,\n${bumpOptionList}`,
    type: "string",
    coerce: choice => {
      if (!semver.valid(choice) && semverKeywords.indexOf(choice) === -1) {
        throw new Error(`bump must be an explicit version string _or_ one of: ${bumpOptionList}`);
      }

      return choice;
    },
  });
};
