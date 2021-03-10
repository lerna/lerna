"use strict";

const path = require("path");
const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports.getTaggedPackages = getTaggedPackages;

/**
 * Retrieve a list of graph nodes for packages that were tagged in a non-independent release.
 * @param {import("@lerna/package-graph").PackageGraph} packageGraph
 * @param {string} rootPath
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 * @returns {Promise<import("@lerna/package-graph").PackageGraphNode[]>}
 */
function getTaggedPackages(packageGraph, rootPath, execOpts) {
  log.silly("getTaggedPackages");

  // @see https://stackoverflow.com/a/424142/5707
  // FIXME: --root is only necessary for tests :P
  return childProcess
    .exec("git", ["diff-tree", "--name-only", "--no-commit-id", "--root", "-r", "-c", "HEAD"], execOpts)
    .then(({ stdout }) => {
      const manifests = stdout.split("\n").filter((fp) => path.basename(fp) === "package.json");
      const locations = new Set(manifests.map((fp) => path.join(rootPath, path.dirname(fp))));

      return Array.from(packageGraph.values()).filter((node) => locations.has(node.location));
    });
}
