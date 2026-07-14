import { readFileSync } from "fs";
import path from "path";
import { tempDirSerializer } from "./serialize-tempdir";
import { windowsPathSerializer } from "./serialize-windows-paths";
import type { Config, Refs, Printer } from "@vitest/pretty-format";

import normalizeNewline from "normalize-newline";
import type { SnapshotSerializer } from "vitest";
const LERNA_VERSION = JSON.parse(
  readFileSync(path.join(__dirname, "../../../../../", "packages/lerna/package.json"), "utf8")
).version;

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
export const placeholderSerializer: SnapshotSerializer = {
  serialize: (
    thing: string | LernaObject | Error,
    config: Config,
    indentation: string,
    depth: number,
    refs: Refs,
    printer: Printer
  ) => {
    // vitest passes thrown Error objects to serializers (jest passed the
    // message string), so serialize the message to keep snapshots stable
    if (thing instanceof Error) {
      thing = thing.message;
    }

    if (isString(thing)) {
      // this always removes redundant quotes for multiline strings
      let val = stabilizeString(thing);

      val = windowsPathSerializer.serialize(val, config, indentation, depth);
      val = tempDirSerializer.serialize(val, config, indentation, depth);

      return val;
    }

    // object properties only contain versions

    thing.lerna = stableVersion(thing.lerna);

    return printer(thing, config, indentation, depth, refs);
  },
  test: (thing: string | LernaObject | Error) => {
    if (thing instanceof Error) {
      thing = thing.message;
    }

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

// this is needed to use the serializer via the snapshotSerializers config option
export default placeholderSerializer;
