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
export function updateLernaConfig(testDir: any, updates: any): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Project } = require("@lerna/core");
  const project = new Project(testDir);

  Object.assign(project.config, updates);

  return project.serializeConfig();
}

export function normalizeRelativeDir(testDir: string, filePath: string) {
  return normalizePath(path.relative(testDir, filePath));
}
