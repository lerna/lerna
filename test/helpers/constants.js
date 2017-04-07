/**
Shared constants for tests
**/
"use strict";

const path = require("path");
const pkg = require("../../package.json");

exports.REPO_ROOT = path.resolve(__dirname, "../..");
exports.LERNA_BIN = path.resolve(exports.REPO_ROOT, pkg.bin.lerna);
exports.LERNA_VERSION = pkg.version;

// placeholder used in fixture JSON files, replaced during tests
exports.__TEST_VERSION__ = "__TEST_VERSION__";
