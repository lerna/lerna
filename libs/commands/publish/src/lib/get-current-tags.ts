import { log } from "@lerna/core";
import { ExecOptions } from "child_process";
import npa from "npm-package-arg";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

/**
 * Retrieve a list of git tags pointing to the current HEAD that match the provided pattern.
 */
export async function getCurrentTags(execOpts: ExecOptions, matchingPattern: string): Promise<string[]> {
  log.silly("getCurrentTags", "matching %j", matchingPattern);

  const opts = Object.assign({}, execOpts, {
    // don't reject due to non-zero exit code when there are no results
    reject: false,
  });

  const result = await childProcess.exec(
    "git",
    ["tag", "--sort", "version:refname", "--points-at", "HEAD", "--list", matchingPattern],
    opts
  );
  const lines: string[] = result.stdout.split("\n").filter(Boolean);

  if (matchingPattern === "*@*") {
    // independent mode does not respect tagVersionPrefix,
    // but embeds the package name in the tag "prefix"
    return lines.map((tag) => npa(tag).name);
  }

  // "fixed" mode can have a custom tagVersionPrefix,
  // but it doesn't really matter as it is not used to extract package names
  return lines;
}
