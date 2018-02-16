"use strict";

// file under test
const Package = require("../src/Package");
const PackageGraph = require("../src/PackageGraph");

describe("PackageGraph", () => {
  describe(".get()", () => {
    it("should return a node with localDependencies", () => {
      const packages = [
        new Package(
          {
            name: "my-package-1",
            version: "1.0.0",
            dependencies: {
              "external-thing": "^1.0.0",
            },
          },
          "/path/to/package-1"
        ),
        new Package(
          {
            name: "my-package-2",
            version: "1.0.0",
            devDependencies: {
              "my-package-1": "^1.0.0",
            },
          },
          "/path/to/package-2"
        ),
      ];
      const graph = new PackageGraph(packages, { graphType: "allDependencies" });

      expect(graph.get("my-package-1").localDependencies.size).toBe(0);
      expect(graph.get("my-package-2").localDependencies.has("my-package-1")).toBe(true);
    });

    it("should skip gitCommittish of packages that are not in localDependencies", () => {
      const packages = [
        new Package(
          {
            name: "my-package-1",
            version: "1.0.0",
            devDependencies: {
              "my-package-2": "^1.0.0",
            },
          },
          "/path/to/package-1"
        ),
        new Package(
          {
            name: "my-package-2",
            version: "1.0.0",
            dependencies: {
              "external-thing": "github:user-foo/project-foo#v1.0.0",
            },
          },
          "/path/to/package-2"
        ),
      ];
      const graph = new PackageGraph(packages, { graphType: "dependencies" });

      expect(graph.get("my-package-1").localDependencies.size).toBe(0);
      expect(graph.get("my-package-2").localDependencies.size).toBe(0);
    });

    it("should return the localDependencies for matched gitCommittish", () => {
      const packages = [
        new Package(
          {
            name: "my-package-1",
            version: "1.0.0",
            dependencies: {
              "external-thing": "^1.0.0",
            },
          },
          "/path/to/package-1"
        ),
        new Package(
          {
            name: "my-package-2",
            version: "1.0.0",
            devDependencies: {
              "my-package-1": "github:user-foo/project-foo#v1.0.0",
            },
          },
          "/path/to/package-2"
        ),
      ];
      const graph = new PackageGraph(packages, { graphType: "allDependencies" });

      expect(graph.get("my-package-2").localDependencies.has("my-package-1")).toBe(true);
    });
  });
});
