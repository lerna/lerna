/* eslint node/no-unsupported-features: ["error", { version: 4 }] */
// this file is not transpiled by Jest when configured in "snapshotSerializers"
"use strict";

const _ = require("lodash");
const normalizeNewline = require("normalize-newline");
const constants = require("./constants");

const VERSION_REGEX = new RegExp(`v?${constants.LERNA_VERSION}`, "gm");
// TODO: maybe less naïve regex?

function needsReplacement(str) {
  return (
    str.indexOf(constants.__TEST_VERSION__) === -1
  );
}

function stableVersion(str) {
  return str.replace(VERSION_REGEX, constants.__TEST_VERSION__);
}

const stabilizeString = _.flow([
  normalizeNewline,
  stableVersion,
]);

/**
A snapshot serializer that replaces all instances of unstable version number
with __TEST_VERSION__ when found in snapshotted strings or object properties.

@see http://facebook.github.io/jest/docs/expect.html#expectaddsnapshotserializerserializer
**/
module.exports = {
  test(thing) {
    return _.isString(thing) && needsReplacement(thing) || (
      _.isPlainObject(thing) && _.isString(thing.lerna) && needsReplacement(thing.lerna)
    );
  },

  print(thing, serialize) {
    if (_.isString(thing)) {
      thing = stabilizeString(thing);
    } else if (_.isPlainObject(thing)) {
      thing.lerna = stableVersion(thing.lerna);
    }

    return serialize(thing);
  },
};
