import semver from "semver";

/**
 * Represents a node in a PackageGraph.
 * @constructor
 * @param {!<Package>} pkg - A Package object to build the node from.
 */
export class PackageGraphNode {
  constructor(pkg) {
    this.package = pkg;
    this.dependencies = [];
    this.localDependents = [];
  }

  satisfies(versionRange) {
    return semver.satisfies(this.package.version, versionRange);
  }
}

/**
 * Represents a node in a PackageGraph.
 * @constructor
 * @param {!Array.<Package>} packages An array of Packages to build the graph out of.
 * @param {boolean} [depsOnly=false] True to create a graph of only dependencies, excluding the
 *    devDependencies that would normally be included.
 */
export default class PackageGraph {
  constructor(packages, depsOnly = false, versionParser) {
    this.nodes = [];
    this.nodesByName = {};

    for (let p = 0; p < packages.length; p += 1) {
      const pkg = packages[p];
      const node = new PackageGraphNode(pkg);
      this.nodes.push(node);
      this.nodesByName[pkg.name] = node;
    }

    for (let n = 0; n < this.nodes.length; n += 1) {
      const node = this.nodes[n];
      const dependencies = node.package[depsOnly ? "dependencies" : "allDependencies"] || {};
      const depNames = Object.keys(dependencies);

      for (let d = 0; d < depNames.length; d += 1) {
        const depName = depNames[d];
        const packageNode = this.nodesByName[depName];

        if (packageNode) {
          const depVersion = versionParser
            ? versionParser.parseVersion(dependencies[depName]).version
            : dependencies[depName];

          if (packageNode.satisfies(depVersion)) {
            node.dependencies.push(depName);
            packageNode.localDependents.push(node.package.name);
          }
        }
      }
    }
  }

  get(packageName) {
    return this.nodesByName[packageName];
  }
}
