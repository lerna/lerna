import { getPackage, ProjectGraphProjectNodeWithPackage } from "@lerna/core";
import { ExecOptions } from "child_process";
import log from "npmlog";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

/**
 * Retrieve a list of graph nodes for packages that were tagged in a non-independent release.
 */
export async function getProjectsWithTaggedPackages(
  projectNodes: ProjectGraphProjectNodeWithPackage[],
  rootPath: string,
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
  const manifests = stdout.split("\n").filter((fp) => path.basename(fp) === "package.json");
  const locations = new Set(manifests.map((fp) => path.join(rootPath, path.dirname(fp))));

  return projectNodes.filter((node) => locations.has(getPackage(node).location));
}
