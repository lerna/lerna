/* eslint node/no-unsupported-features: ["error", { version: 4 }] */
// this file is not transpiled by Jest when configured in "snapshotSerializers"

"use strict";

const normalizeNewline = require("normalize-newline");
const constants = require("./constants");

const VERSION_REGEX = new RegExp(`^(?:((?:.*?version )|\\^)|v?)${constants.LERNA_VERSION}`, "gm");
const VERSION_REPLACEMENT = `$1${constants.__TEST_VERSION__}`;
// TODO: maybe even less naïve regex?

function isObject(val) {
  return val && typeof val === "object" && Array.isArray(val) === false;
}

function isString(val) {
  return val && typeof val === "string";
}

function needsReplacement(str) {
  return str.indexOf(constants.__TEST_VERSION__) === -1;
}

function stableVersion(str) {
  return str.replace(VERSION_REGEX, VERSION_REPLACEMENT);
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
      return needsReplacement(thing.lerna);
    }

    return isString(thing) && needsReplacement(thing);
  },

  print(thing, serialize) {
    if (isString(thing)) {
      return stabilizeString(thing);
    }

    // eslint-disable-next-line no-param-reassign
    thing.lerna = stableVersion(thing.lerna);

    return serialize(thing);
  },
};
