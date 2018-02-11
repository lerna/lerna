"use strict";

const PackageGraph = require("../PackageGraph");

module.exports = createPackageGraph;

// a convenient wrapper around the underlying constructor
function createPackageGraph(packages, { graphType = "allDependencies", forceLocal } = {}) {
  return new PackageGraph(packages, { graphType, forceLocal });
}
