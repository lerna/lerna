import { Command, Package, PackageGraph, symlinkDependencies, ValidationError } from "@lerna/core";
import pMap from "p-map";
import path from "path";
import slash from "slash";

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new LinkCommand(argv);
};

class LinkCommand extends Command {
  allPackages: Package[];
  targetGraph: PackageGraph;

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

    this.allPackages = this.packageGraph.rawPackageList;

    if (this.options.contents) {
      // globally override directory to link
      for (const pkg of this.allPackages) {
        pkg.contents = this.options.contents;
      }
    }

    this.targetGraph = this.options.forceLocal
      ? // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        new PackageGraph(this.allPackages, "allDependencies", "forceLocal")
      : this.packageGraph;
  }

  override execute() {
    if (this.options._.pop() === "convert") {
      return this.convertLinksToFileSpecs();
    }

    return symlinkDependencies(this.allPackages, this.targetGraph, this.logger.newItem("link dependencies"));
  }

  convertLinksToFileSpecs() {
    const rootPkg = this.project.manifest;
    const rootDependencies = {};
    const hoisted = {};
    const changed = new Set();
    const savePrefix = "file:";

    for (const targetNode of this.targetGraph.values()) {
      const resolved = { name: targetNode.name, type: "directory" };

      // install root file: specifiers to avoid bootstrap
      rootDependencies[targetNode.name] = targetNode.pkg.resolved.saveSpec;

      for (const depNode of targetNode.localDependents.values()) {
        const depVersion = slash(path.relative(depNode.pkg.location, targetNode.pkg.location));
        // console.log("\n%s\n  %j: %j", depNode.name, name, `${savePrefix}${depVersion}`);

        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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

    // mutate project manifest, completely overwriting existing dependencies
    rootPkg.set("dependencies", rootDependencies);
    rootPkg.set("devDependencies", Object.assign(rootPkg.get("devDependencies") || {}, hoisted));

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return pMap(changed, (node) => node.pkg.serialize()).then(() => rootPkg.serialize());
  }
}

module.exports.LinkCommand = LinkCommand;
