import path from "path";
import normalizePath from "normalize-path";

export default function normalizeRelativeDir(testDir, filePath) {
  return normalizePath(path.relative(testDir, filePath));
}
