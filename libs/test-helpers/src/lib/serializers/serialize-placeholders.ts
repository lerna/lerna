import path from "path";
import { tempDirSerializer } from "./serialize-tempdir";
import { windowsPathSerializer } from "./serialize-windows-paths";
import { Config, Refs, Printer } from "pretty-format";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const normalizeNewline = require("normalize-newline");
// eslint-disable-next-line node/no-unpublished-require, import/no-unresolved, node/no-missing-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
const LERNA_VERSION = require(path.join(__dirname, "../../../../../", "packages/lerna/package.json")).version;

const VERSION_REGEX = new RegExp(`^((?:.*?notice cli )|\\^?)v?${LERNA_VERSION}`, "g");
// TODO: maybe even less naïve regex?

type LernaObject = { lerna: string };

function isObject(val: string | LernaObject): val is LernaObject {
  return typeof val === "object" && !Array.isArray(val);
}

function isString(val: string | LernaObject): val is string {
  return typeof val === "string";
}

function stableVersion(str: string) {
  return str.replace(VERSION_REGEX, "$1__TEST_VERSION__");
}

function stabilizeString(str: string) {
  return stableVersion(normalizeNewline(str));
}

/**
 * A snapshot serializer that replaces all instances of unstable version number
 * with __TEST_VERSION__ when found in snapshotted strings or object properties.
 *
 * @see http://facebook.github.io/jest/docs/expect.html#expectaddsnapshotserializerserializer
 */
export const placeholderSerializer: jest.SnapshotSerializerPlugin = {
  serialize: (
    thing: string | LernaObject,
    config: Config,
    indentation: string,
    depth: number,
    refs: Refs,
    printer: Printer
  ) => {
    if (isString(thing)) {
      // this always removes redundant quotes for multiline strings
      let val = stabilizeString(thing);

      val = windowsPathSerializer.serialize(val, config, indentation, depth);
      val = tempDirSerializer.serialize(val, config, indentation, depth);

      return val;
    }

    // object properties only contain versions
    // eslint-disable-next-line no-param-reassign
    thing.lerna = stableVersion(thing.lerna);

    return printer(thing, config, indentation, depth, refs);
  },
  test: (thing: string | LernaObject) => {
    if (isObject(thing) && isString(thing.lerna)) {
      // object properties only contain versions
      return VERSION_REGEX.test(thing.lerna);
    }

    return (
      isString(thing) &&
      (windowsPathSerializer.test(thing) ||
        tempDirSerializer.test(thing) ||
        VERSION_REGEX.test(thing) ||
        // always remove redundant quotes from multiline strings
        /\n/.test(thing))
    );
  },
};

// this is needed to use the serializer in a jest.config.ts
module.exports = placeholderSerializer;
