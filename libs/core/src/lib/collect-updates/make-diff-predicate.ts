// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require("@lerna/child-process");
import { ExecOptions } from "child_process";
import minimatch from "minimatch";
import log from "npmlog";
import { relative } from "path";
import slash from "slash";
import { getPackage, ProjectGraphProjectNodeWithPackage } from "../project-graph-with-packages";

export function makeDiffPredicate(
  committish: string,
  execOpts: ExecOptions,
  ignorePatterns: string[] = []
): (node: ProjectGraphProjectNodeWithPackage) => boolean {
  const ignoreFilters = new Set(
    ignorePatterns.map((p) =>
      minimatch.filter(`!${p}`, {
        matchBase: true,
        // dotfiles inside ignored directories should also match
        dot: true,
      })
    )
  );

  if (ignoreFilters.size) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    log.info("ignoring diff in paths matching", ignorePatterns);
  }

  return function hasDiffSinceThatIsntIgnored(node: ProjectGraphProjectNodeWithPackage) {
    const diff = diffSinceIn(committish, getPackage(node).location, execOpts);

    if (diff === "") {
      log.silly("", "no diff found in %s", node.name);
      return false;
    }

    log.silly("found diff in", diff);
    let changedFiles = diff.split("\n");

    if (ignoreFilters.size) {
      for (const ignored of ignoreFilters) {
        changedFiles = changedFiles.filter(ignored);
      }
    }

    if (changedFiles.length) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      log.verbose("filtered diff", changedFiles);
    } else {
      log.verbose("", "no diff found in %s (after filtering)", node.name);
    }

    return changedFiles.length > 0;
  };
}

function diffSinceIn(committish: string, location: string, opts: ExecOptions) {
  const args = ["diff", "--name-only", committish];
  const formattedLocation = slash(relative(opts.cwd as string, location));

  if (formattedLocation) {
    // avoid same-directory path.relative() === ""
    args.push("--", formattedLocation);
  }

  log.silly("checking diff", formattedLocation);
  return execSync("git", args, opts);
}
