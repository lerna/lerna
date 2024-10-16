import { glob } from "tinyglobby";
import loadJsonFile from "load-json-file";

export function loadManifests(cwd: string): any {
  return glob(
    [
      // all child packages, at any level
      "**/package.json",
      // but not the root
      "!package.json",
      // and not installed
      "!**/node_modules",
    ],
    {
      cwd,
      absolute: true,
      followSymbolicLinks: false,
    }
  ).then((files) => Promise.all(files.sort().map((fp) => loadJsonFile(fp))));
}
