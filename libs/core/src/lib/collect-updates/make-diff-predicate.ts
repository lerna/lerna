// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");
import log from "npmlog";
import minimatch from "minimatch";
import path from "path";
import slash from "slash";
import { PackageGraphNode } from "../package-graph/package-graph-node";

/**
 * @param {string} committish
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 * @param {string[]} ignorePatterns
 */
export function makeDiffPredicate(committish: string, execOpts: any, ignorePatterns: string[] = []) {
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

  return function hasDiffSinceThatIsntIgnored(node: PackageGraphNode) {
    const diff = diffSinceIn(committish, node.location, execOpts);

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
      log.verbose("filtered diff", changedFiles);
    } else {
      log.verbose("", "no diff found in %s (after filtering)", node.name);
    }

    return changedFiles.length > 0;
  };
}

/**
 * @param {string} committish
 * @param {string} location
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function diffSinceIn(committish: string, location: string, opts: { cwd: string }) {
  const args = ["diff", "--name-only", committish];
  const formattedLocation = slash(path.relative(opts.cwd, location));

  if (formattedLocation) {
    // avoid same-directory path.relative() === ""
    args.push("--", formattedLocation);
  }

  log.silly("checking diff", formattedLocation);
  return childProcess.execSync("git", args, opts);
}
