"use strict";

// helpers
const Package = require("@lerna/package");
const PackageGraph = require("@lerna/package-graph");

module.exports = buildGraph;

function buildGraph(mapPackages = pkg => pkg) {
  // cat __fixtures__/toposort/packages/*/package.json
  const packages = [
    {
      name: "package-cycle-1",
      version: "1.0.0",
      dependencies: {
        "package-cycle-2": "1.0.0",
      },
    },
    {
      name: "package-cycle-2",
      version: "1.0.0",
      dependencies: {
        "package-cycle-1": "1.0.0",
      },
    },
    {
      name: "package-cycle-extraneous",
      version: "1.0.0",
      description: "This package is used to break ties between package-cycle-{1,2}.",
      dependencies: {
        "package-cycle-1": "1.0.0",
      },
    },
    {
      name: "package-dag-1",
      version: "1.0.0",
    },
    {
      name: "package-dag-2a",
      version: "1.0.0",
      dependencies: {
        "package-dag-1": "1.0.0",
      },
    },
    {
      name: "package-dag-2b",
      version: "1.0.0",
      dependencies: {
        "package-dag-1": "1.0.0",
      },
    },
    {
      name: "package-dag-3",
      version: "1.0.0",
      dependencies: {
        "package-dag-2a": "1.0.0",
        "package-dag-1": "1.0.0",
      },
    },
    {
      name: "package-standalone",
      version: "1.0.0",
    },
  ]
    .map(mapPackages)
    .map(json => new Package(json, `/test/packages/${json.name}`, "/test"));

  return new PackageGraph(packages);
  // require("console").dir(graph, { compact: false })
}
