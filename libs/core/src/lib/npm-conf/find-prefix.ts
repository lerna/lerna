import fs from "fs";
import path from "path";

// https://github.com/npm/npm/blob/876f0c8/lib/config/find-prefix.js
export function findPrefix(start: string) {
  let dir = path.resolve(start);
  let walkedUp = false;

  while (path.basename(dir) === "node_modules") {
    dir = path.dirname(dir);
    walkedUp = true;
  }

  if (walkedUp) {
    return dir;
  }

  return find(dir, dir);
}

function find(name: string, original: string): any {
  if (name === "/" || (process.platform === "win32" && /^[a-zA-Z]:(\\|\/)?$/.test(name))) {
    return original;
  }

  try {
    const files = fs.readdirSync(name);

    if (files.indexOf("node_modules") !== -1 || files.indexOf("package.json") !== -1) {
      return name;
    }

    const dirname = path.dirname(name);

    if (dirname === name) {
      return original;
    }

    return find(dirname, original);
  } catch (err) {
    if (name === original) {
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (err.code === "ENOENT") {
        return original;
      }

      throw err;
    }

    return original;
  }
}
