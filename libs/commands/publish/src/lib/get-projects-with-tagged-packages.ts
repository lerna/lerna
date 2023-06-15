import { ProjectGraphProjectNodeWithPackage } from "@lerna/core";
import { ProjectFileMap } from "@nx/devkit";
import { ExecOptions } from "child_process";
import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

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
  const result = await childProcess.exec(
    "git",
    ["diff-tree", "--name-only", "--no-commit-id", "--root", "-r", "-c", "HEAD"],
    execOpts
  );

  const stdout: string = result.stdout;
  const files = new Set(stdout.split("\n"));

  return projectNodes.filter((node) => projectFileMap[node.name]?.some((file) => files.has(file.file)));
}
