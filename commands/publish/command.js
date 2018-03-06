"use strict";

const PublishCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "publish";

exports.describe = "Publish packages in the current project.";

const cdVersionOptions = ["major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease"];

const cdVersionOptionString = `'${cdVersionOptions.slice(0, -1).join("', '")}', or '${
  cdVersionOptions[cdVersionOptions.length - 1]
}'.`;

exports.builder = {
  canary: {
    group: "Command Options:",
    defaultDescription: "alpha",
    describe: "Publish packages after every successful merge using the sha as part of the tag.",
    alias: "c",
    // NOTE: this type must remain undefined, as it is too overloaded to make sense
    // type: "string",
  },
  "cd-version": {
    group: "Command Options:",
    describe: `Skip the version selection prompt and increment semver: ${cdVersionOptionString}`,
    type: "string",
    requiresArg: true,
    coerce: choice => {
      if (cdVersionOptions.indexOf(choice) === -1) {
        throw new Error(`--cd-version must be one of: ${cdVersionOptionString}`);
      }
      return choice;
    },
  },
  "conventional-commits": {
    group: "Command Options:",
    describe: "Use angular conventional-commit format to determine version bump and generate CHANGELOG.",
    type: "boolean",
    default: undefined,
  },
  "changelog-preset": {
    group: "Command Options:",
    describe: "Use another conventional-changelog preset rather than angular.",
    type: "string",
    default: undefined,
  },
  exact: {
    group: "Command Options:",
    describe: "Specify cross-dependency version numbers exactly rather than with a caret (^).",
    type: "boolean",
    default: undefined,
  },
  "git-remote": {
    group: "Command Options:",
    defaultDescription: "origin",
    describe: "Push git changes to the specified remote instead of 'origin'.",
    type: "string",
    requiresArg: true,
  },
  yes: {
    group: "Command Options:",
    describe: "Skip all confirmation prompts.",
    type: "boolean",
    default: undefined,
  },
  message: {
    group: "Command Options:",
    describe: "Use a custom commit message when creating the publish commit.",
    alias: "m",
    type: "string",
    requiresArg: true,
  },
  "npm-tag": {
    group: "Command Options:",
    describe: "Publish packages with the specified npm dist-tag",
    type: "string",
    requiresArg: true,
  },
  "npm-client": {
    group: "Command Options:",
    describe: "Executable used to publish dependencies (npm, yarn, pnpm, ...)",
    type: "string",
    requiresArg: true,
  },
  registry: {
    group: "Command Options:",
    describe: "Use the specified registry for all npm client operations.",
    type: "string",
    requiresArg: true,
  },
  preid: {
    group: "Command Options:",
    describe: "Specify the prerelease identifier (major.minor.patch-pre).",
    type: "string",
    requiresArg: true,
  },
  "repo-version": {
    group: "Command Options:",
    describe: "Specify repo version to publish.",
    type: "string",
    requiresArg: true,
  },
  "skip-git": {
    group: "Command Options:",
    describe: "Skip commiting, tagging, and pushing git changes.",
    type: "boolean",
    default: undefined,
  },
  "skip-npm": {
    group: "Command Options:",
    describe: "Stop before actually publishing change to npm.",
    type: "boolean",
    default: undefined,
  },
  "temp-tag": {
    group: "Command Options:",
    describe: "Create a temporary tag while publishing.",
    type: "boolean",
    default: undefined,
  },
  "allow-branch": {
    group: "Command Options:",
    describe: "Specify which branches to allow publishing from.",
    type: "array",
  },
};

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new PublishCommand(argv);
};
