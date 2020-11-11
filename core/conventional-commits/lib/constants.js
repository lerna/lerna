"use strict";

// changelogs are always written with LF line endings
const EOL = "\n";

exports.EOL = EOL;

exports.BLANK_LINE = EOL + EOL;

exports.COMMIT_GUIDELINE =
  "See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.";

exports.CHANGELOG_HEADER_TEMPLATE = [
  "# Change Log",
  "",
  "All notable changes to this project will be documented in this file.",
];

exports.CHANGELOG_HEADER = [...exports.CHANGELOG_HEADER_TEMPLATE, exports.COMMIT_GUIDELINE].join(EOL);
