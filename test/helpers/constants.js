// this file is not transpiled by Jest when required in replaceLernaVersion.js
"use strict";

const path = require("path");
const pkg = require("../../package.json");

/**
Shared constants for tests
**/
exports.LERNA_VERSION = pkg.version;
exports.LERNA_ROOTDIR = path.resolve(__dirname, "../..");
exports.LERNA_BIN = path.resolve(exports.LERNA_ROOTDIR, pkg.bin.lerna);

// placeholders used in fixture JSON files, replaced during tests
exports.__TEST_VERSION__ = "__TEST_VERSION__";
exports.__TEST_ROOTDIR__ = "__TEST_ROOTDIR__";
