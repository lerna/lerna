// this file is not transpiled by Jest when configured in "snapshotSerializers"
"use strict";

const _ = require("lodash");
const normalizeNewline = require("normalize-newline");
const constants = require("./constants");

const ROOTDIR_REGEX = new RegExp(constants.LERNA_ROOTDIR, "gm");
const VERSION_REGEX = new RegExp(`v?${constants.LERNA_VERSION}`, "gm");
// TODO: maybe less naïve regex?

function needsReplacement(str) {
  return (
    str.indexOf(constants.__TEST_ROOTDIR__) === -1 &&
    str.indexOf(constants.__TEST_VERSION__) === -1
  );
}

function stableRootDir(str) {
  return str.replace(ROOTDIR_REGEX, constants.__TEST_ROOTDIR__);
}

function stableVersion(str) {
  return str.replace(VERSION_REGEX, constants.__TEST_VERSION__);
}

const stabilizeValue = _.flow([
  stableVersion,
  stableRootDir,
]);

const stabilizeString = _.flow([
  normalizeNewline,
  stabilizeValue,
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
      thing.lerna = stabilizeValue(thing.lerna);
    }

    return serialize(thing);
  },
};
