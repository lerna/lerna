// @flow

import type Package from './Package';
import semver from "semver";

export class PackageGraphNode {
  package: Package;
  dependencies: Array<string>;

  constructor(pkg: Package) {
    this.package = pkg;
    this.dependencies = [];
  }
}

export default class PackageGraph {
  nodes: Array<PackageGraphNode>;
  nodesByName: { [node: string]: PackageGraphNode };

  constructor(packages: Array<Package>) {
    this.nodes = [];
    this.nodesByName = {};

    for (let p = 0; p < packages.length; p++) {
      const pkg = packages[p];
      const node = new PackageGraphNode(pkg);
      this.nodes.push(node);
      this.nodesByName[pkg.name] = node;
    }

    for (let n = 0; n < this.nodes.length; n++) {
      const node = this.nodes[n];
      const dependencies = node.package.allDependencies;
      const depNames = Object.keys(dependencies);

      for (let d = 0; d < depNames.length; d++) {
        const depName = depNames[d];
        const depVersion = dependencies[depName];
        const packageNode = this.nodesByName[depName];

        if (packageNode && semver.satisfies(packageNode.package.version, depVersion)) {
          node.dependencies.push(depName);
        }
      }
    }
  }

  get(packageName: string) {
    return this.nodesByName[packageName];
  }
}
