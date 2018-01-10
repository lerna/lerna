/* eslint node/no-unsupported-features: ["error", { version: 4 }] */
// this file is not transpiled by Jest when configured in "snapshotSerializers"
"use strict"; // eslint-disable-line strict, lines-around-directive

const _ = require("lodash");
const normalizeNewline = require("normalize-newline");
const constants = require("./constants");

const VERSION_REGEX = new RegExp(`^(?:((?:.*?version )|\\^)|v?)${constants.LERNA_VERSION}`, "gm");
const VERSION_REPLACEMENT = `$1${constants.__TEST_VERSION__}`;
// TODO: maybe even less naïve regex?

function needsReplacement(str) {
  return str.indexOf(constants.__TEST_VERSION__) === -1;
}

function stableVersion(str) {
  return str.replace(VERSION_REGEX, VERSION_REPLACEMENT);
}

const stabilizeString = _.flow([normalizeNewline, stableVersion]);

/**
 * A snapshot serializer that replaces all instances of unstable version number
 * with __TEST_VERSION__ when found in snapshotted strings or object properties.
 *
 * @see http://facebook.github.io/jest/docs/expect.html#expectaddsnapshotserializerserializer
 */
module.exports = {
  test(thing) {
    return (
      (_.isString(thing) && needsReplacement(thing)) ||
      (_.isPlainObject(thing) && _.isString(thing.lerna) && needsReplacement(thing.lerna))
    );
  },

  print(thing, serialize) {
    if (_.isString(thing)) {
      thing = stabilizeString(thing); // eslint-disable-line no-param-reassign
    } else if (_.isPlainObject(thing)) {
      thing.lerna = stableVersion(thing.lerna);
    }

    return serialize(thing);
  },
};
