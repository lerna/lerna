import path from "path";
import { Config } from "pretty-format";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const normalizePath = require("normalize-path");

// tempy creates subdirectories with hexadecimal names that are 32 characters long
const TEMP_DIR_REGEXP = /([^\s"]*[\\/][0-9a-f]{32})([^\s"]*)/g;
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
