import path from "path";
import { Config } from "pretty-format";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const normalizePath = require("normalize-path");

const WHACK_WACK = /(\\)([\S]*)/g;

// expect.addSnapshotSerializer(require("./serialize-windows-paths"));
export const windowsPathSerializer = {
  serialize: (val: string, _config: Config, _indentation: string, depth: number) => {
    const str = val.replace(WHACK_WACK, serializeWindowsPath);

    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${str}"` : str;
  },
  test: (val: unknown) => {
    return typeof val === "string" && WHACK_WACK.test(val);
  },
};

function serializeWindowsPath(match: string, wack: string, wackPath: string) {
  return normalizePath(path.join(wack, wackPath));
}
