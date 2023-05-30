import { joinPathFragments, readJsonFile, writeJsonFile } from "@nx/devkit";
import normalizePath from "normalize-path";
import path from "path";

export * from "./lib/cli";
export * from "./lib/fixtures";
export * from "./lib/git";
export * from "./lib/logging-output";
export { multiLineTrimRight } from "./lib/multi-line-trim-right";
export * from "./lib/npm";
export * from "./lib/serializers";

/**
 * Update lerna config inside a test case.
 *
 * @param testDir where target lerna.json exists
 * @param updates mixed into existing JSON via Object.assign
 */
export function updateLernaConfig(testDir: any, updates: any): void {
  const lernaJsonPath = joinPathFragments(testDir, "lerna.json");
  const current = readJsonFile(lernaJsonPath);

  const updatedLernaJson = {
    ...current,
    ...updates,
  };

  writeJsonFile(joinPathFragments(testDir, "lerna.json"), updatedLernaJson, { spaces: 2 });
}

export function normalizeRelativeDir(testDir: string, filePath: string) {
  return normalizePath(path.relative(testDir, filePath));
}
