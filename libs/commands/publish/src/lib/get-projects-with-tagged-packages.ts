import { ProjectGraphProjectNodeWithPackage, log } from "@lerna/core";
import { ProjectFileMap } from "@nx/devkit";
import { ExecOptions } from "child_process";

import * as childProcess from "@lerna/child-process";

/**
 * Retrieve a list of graph nodes for packages that were tagged in a non-independent release.
 */
export async function getProjectsWithTaggedPackages(
  projectNodes: ProjectGraphProjectNodeWithPackage[],
  projectFileMap: ProjectFileMap,
  execOpts: ExecOptions
): Promise<ProjectGraphProjectNodeWithPackage[]> {
  log.silly("getTaggedPackages", "");

  // @see https://stackoverflow.com/a/424142/5707
  // FIXME: --root is only necessary for tests :P
  // -z keeps git from quoting and escaping paths with non-ASCII characters (core.quotePath)
  const result = await childProcess.exec(
    "git",
    ["diff-tree", "--name-only", "-z", "--no-commit-id", "--root", "-r", "-c", "HEAD"],
    execOpts as any
  );

  const stdout: string = result.stdout;
  const files = new Set(stdout.split("\0").filter(Boolean));

  return projectNodes.filter((node) => projectFileMap[node.name]?.some((file) => files.has(file.file)));
}
