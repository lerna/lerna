/* eslint node/no-unsupported-features: ["error", { version: 4 }] */
// this file is not transpiled by Jest when required in serializePlaceholders.js
"use strict"; // eslint-disable-line strict, lines-around-directive

const path = require("path");
const fileUrl = require("file-url");
const pkg = require("../../package.json");

const LERNA_ROOTDIR = path.resolve(__dirname, "../..");
const LERNA_PKG_TGZ = path.resolve(LERNA_ROOTDIR, `lerna-${pkg.version}.tgz`);

/**
 * Shared constants for tests
 */
exports.LERNA_VERSION = pkg.version;
exports.LERNA_PKG_URL = fileUrl(LERNA_PKG_TGZ);
exports.LERNA_BIN = path.resolve(LERNA_ROOTDIR, pkg.bin.lerna);

// placeholders used in fixture JSON files, replaced during tests
exports.__TEST_VERSION__ = "__TEST_VERSION__";
exports.__TEST_PKG_URL__ = "__TEST_PKG_URL__";
