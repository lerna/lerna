"use strict";

const normalizeNewline = require("normalize-newline");
// eslint-disable-next-line node/no-unpublished-require
const LERNA_VERSION = require("../../core/lerna/package.json").version;

const VERSION_REGEX = new RegExp(`^((?:.*?notice cli )|\\^?)v?${LERNA_VERSION}`, "g");
// TODO: maybe even less naïve regex?

function isObject(val) {
  return val && typeof val === "object" && Array.isArray(val) === false;
}

function isString(val) {
  return val && typeof val === "string";
}

function stableVersion(str) {
  return str.replace(VERSION_REGEX, "$1__TEST_VERSION__");
}

function stabilizeString(str) {
  return stableVersion(normalizeNewline(str));
}

/**
 * A snapshot serializer that replaces all instances of unstable version number
 * with __TEST_VERSION__ when found in snapshotted strings or object properties.
 *
 * @see http://facebook.github.io/jest/docs/expect.html#expectaddsnapshotserializerserializer
 */
module.exports = {
  test(thing) {
    if (isObject(thing) && isString(thing.lerna)) {
      return VERSION_REGEX.test(thing.lerna);
    }

    // also let through multiline strings so we can always remove redundant quotes
    return isString(thing) && (VERSION_REGEX.test(thing) || /\n/.test(thing));
  },
  serialize(thing, config, indentation, depth, refs, printer) {
    if (isString(thing)) {
      // this always removes redundant quotes for multiline strings
      return stabilizeString(thing);
    }

    // eslint-disable-next-line no-param-reassign
    thing.lerna = stableVersion(thing.lerna);

    return printer(thing, config, indentation, depth, refs);
  },
};
