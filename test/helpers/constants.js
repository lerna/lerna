/* eslint node/no-unsupported-features: ["error", { version: 4 }] */
// this file is not transpiled by Jest when required in serializePlaceholders.js

"use strict";

const path = require("path");
const pkg = require("../../package.json");

/**
 * Shared constants for tests
 */
exports.LERNA_VERSION = pkg.version;
exports.LERNA_BIN = path.resolve(__dirname, "../..", pkg.bin.lerna);

// placeholders for serializing snapshots
exports.__TEST_VERSION__ = "__TEST_VERSION__";
