import path from "path";
import { Config } from "pretty-format";

const normalizePath = require("normalize-path");

// Match temp directories created by mkdtempSync with "lerna-test-" prefix (6 random chars)
const TEMP_DIR_REGEXP = /([^\s"]*[\\/]lerna-test-[A-Za-z0-9]{6})([^\s"]*)/g;
// the excluded quotes are due to other snapshot serializers mutating the raw input

export const tempDirSerializer = {
  serialize: (val: string, _config: Config, _indentation: string, depth: number) => {
    const str = val.replace(TEMP_DIR_REGEXP, serializeProjectRoot);

    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${str}"` : str;
  },
  test: (val: unknown) => {
    return typeof val === "string" && TEMP_DIR_REGEXP.test(val);
  },
};

function serializeProjectRoot(_match: string, _cwd: string, subPath: string) {
  return normalizePath(path.join("__TEST_ROOTDIR__", subPath));
}
