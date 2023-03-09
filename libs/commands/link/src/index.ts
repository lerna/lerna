import {
  Command,
  CommandConfigOptions,
  Package,
  PackageGraph,
  PackageGraphNode,
  symlinkDependencies,
  ValidationError,
} from "@lerna/core";

import pMap from "p-map";
import path from "path";
import slash from "slash";
import npa from "npm-package-arg";

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new LinkCommand(argv);
};

interface LinkCommandOptions extends CommandConfigOptions {
  contents: string;
  forceLocal: boolean;
}

class LinkCommand extends Command<LinkCommandOptions> {
  allPackages: Package[] = [];
  targetGraph?: PackageGraph;

  override get requiresGit() {
    return false;
  }

  override initialize() {
    if (this.options.npmClient === "pnpm") {
      throw new ValidationError(
        "EWORKSPACES",
        "Link is not supported with pnpm workspaces, since pnpm will automatically link dependencies during `pnpm install`. See the pnpm docs for details: https://pnpm.io/workspaces"
      );
    }

    this.allPackages = this.packageGraph?.rawPackageList ?? [];

    if (this.options.contents) {
      // globally override directory to link
      for (const pkg of this.allPackages) {
        pkg.contents = this.options.contents;
      }
    }

    this.targetGraph = this.options.forceLocal
      ? new PackageGraph(this.allPackages, "allDependencies", true)
      : this.packageGraph;
  }

  override execute() {
    if (this.options._?.pop() === "convert") {
      return this.convertLinksToFileSpecs();
    }

    return symlinkDependencies(this.allPackages, this.targetGraph, this.logger.newItem("link dependencies"));
  }

  convertLinksToFileSpecs() {
    const rootPkg = this.project.manifest;
    const rootDependencies: Record<string, string> = {};
    const hoisted = {};
    const changed = new Set<PackageGraphNode>();
    const savePrefix = "file:";
    if (this.targetGraph) {
      for (const targetNode of this.targetGraph.values()) {
        const resolved: npa.Result = {
          name: targetNode.name,
          type: "directory",
          registry: false,
          scope: null,
          escapedName: null,
          rawSpec: "",
          saveSpec: null,
          fetchSpec: null,
          raw: "",
        };

        // install root file: specifiers to avoid bootstrap
        if (targetNode.pkg.resolved.saveSpec) {
          rootDependencies[targetNode.name] = targetNode.pkg.resolved.saveSpec;
        }

        for (const depNode of targetNode.localDependents.values()) {
          const depVersion = slash(path.relative(depNode.pkg.location, targetNode.pkg.location));
          // console.log("\n%s\n  %j: %j", depNode.name, name, `${savePrefix}${depVersion}`);

          depNode.pkg.updateLocalDependency(resolved, depVersion, savePrefix);
          changed.add(depNode);
        }

        if (targetNode.pkg.devDependencies) {
          // hoist _all_ devDependencies to the root
          Object.assign(hoisted, targetNode.pkg.devDependencies);
          targetNode.pkg.set("devDependencies", {});
          changed.add(targetNode);
        }
      }
    }

    // mutate project manifest, completely overwriting existing dependencies
    rootPkg?.set("dependencies", rootDependencies);
    rootPkg?.set("devDependencies", Object.assign(rootPkg?.get("devDependencies") || {}, hoisted));

    return pMap(changed, (node) => node.pkg.serialize()).then(() => rootPkg?.serialize());
  }
}

module.exports.LinkCommand = LinkCommand;
