import fs from "fs-extra";
import pMap from "p-map";
import pMapSeries from "p-map-series";
import path from "path";
import { createSymlink } from "./create-symlink";
import { Package } from "./package";
import { PackageGraph } from "./package-graph";
import { resolveSymlink } from "./resolve-symlink";
import { symlinkBinary } from "./symlink-binary";

// TODO: figure out what a Tracker is supposed to be...
type Tracker = any;

/**
 * Symlink all packages to the packages/node_modules directory
 * Symlink package binaries to dependent packages' node_modules/.bin directory
 */
export function symlinkDependencies(
  packages: Package[],
  packageGraph: PackageGraph,
  tracker: Tracker
): Promise<any> {
  tracker.info("", "Symlinking packages and binaries");
  tracker.addWork(packages.length);

  const nodes =
    packageGraph.size === packages.length
      ? packageGraph.values()
      : new Set(packages.map(({ name }) => packageGraph.get(name)));

  return pMapSeries(nodes, (currentNode) => {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const currentName = currentNode.name;
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const currentNodeModules = currentNode.pkg.nodeModulesLocation;

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return pMap(currentNode.localDependencies, ([dependencyName, resolved]) => {
      if (resolved.type === "directory") {
        // a local file: specifier is already a symlink
        return;
      }

      // get PackageGraphNode of dependency
      // const dependencyName = resolved.name;
      const dependencyNode = packageGraph.get(dependencyName);
      const targetDirectory = path.join(currentNodeModules, dependencyName);

      let chain = Promise.resolve();

      // check if dependency is already installed
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chain = chain.then(() => fs.pathExists(targetDirectory));
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chain = chain.then((dirExists) => {
        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (dirExists) {
          const isDepSymlink = resolveSymlink(targetDirectory);

          // TODO: refactor based on TS feedback
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (isDepSymlink !== false && isDepSymlink !== dependencyNode.location) {
            // installed dependency is a symlink pointing to a different location
            tracker.warn(
              "EREPLACE_OTHER",
              `Symlink already exists for ${dependencyName} dependency of ${currentName}, ` +
                "but links to different location. Replacing with updated symlink..."
            );
          } else if (isDepSymlink === false) {
            // installed dependency is not a symlink
            tracker.warn(
              "EREPLACE_EXIST",
              `${dependencyName} is already installed for ${currentName}. Replacing with symlink...`
            );

            // remove installed dependency
            return fs.remove(targetDirectory);
          }
        } else {
          // ensure destination directory exists (dealing with scoped subdirs)
          return fs.ensureDir(path.dirname(targetDirectory));
        }
      });

      // create package symlink
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const dependencyLocation = dependencyNode.pkg.contents
        ? // TODO: refactor based on TS feedback
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          path.resolve(dependencyNode.location, dependencyNode.pkg.contents)
        : // TODO: refactor based on TS feedback
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          dependencyNode.location;
      chain = chain.then(() => createSymlink(dependencyLocation, targetDirectory, "junction"));

      // TODO: pass PackageGraphNodes directly instead of Packages
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chain = chain.then(() => symlinkBinary(dependencyNode.pkg, currentNode.pkg));

      return chain;
    }).then(() => {
      tracker.silly("actions", "finished", currentName);
      tracker.completeWork(1);
    });
  }).finally(() => tracker.finish());
}
