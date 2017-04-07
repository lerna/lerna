import _ from "lodash";
import normalizeNewline from "normalize-newline";
import { LERNA_VERSION, __TEST_VERSION__ } from "./constants";

const REGEX = new RegExp(`v?${LERNA_VERSION}`, "gm");
// TODO: maybe less naïve regex?

function needsReplacement(str) {
  return str.indexOf(__TEST_VERSION__) === -1;
}

function stableVersion(str) {
  return str.replace(REGEX, __TEST_VERSION__);
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
export default {
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
      serialize(thing);
    }

    return serialize(thing);
  },
};
