// TODO: refactor based on TS feedback
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Package } from "../package";
import { PackageGraph } from "./index";

describe("PackageGraph", () => {
  describe("constructor", () => {
    it("throws an error when duplicate package names are present", () => {
      const pkgs = [
        new Package({ name: "pkg-1", version: "1.0.0" }, "/test/pkg-1", "/test"),
        new Package({ name: "pkg-2", version: "2.0.0" }, "/test/pkg-2", "/test"),
        new Package({ name: "pkg-2", version: "3.0.0" }, "/test/pkg-3", "/test"),
      ];

      expect(() => new PackageGraph(pkgs)).toThrowErrorMatchingInlineSnapshot(`
        "Package name \\"pkg-2\\" used in multiple packages:
        	/test/pkg-2
        	/test/pkg-3"
      `);
    });

    it("externalizes non-satisfied semver of local sibling", () => {
      const pkgs = [
        new Package(
          {
            name: "pkg-1",
            version: "1.0.0",
            optionalDependencies: {
              // non-circular external
              "pkg-2": "^1.0.0",
            },
          },
          "/test/pkg-1"
        ),
        new Package(
          {
            name: "pkg-2",
            version: "2.0.0",
            devDependencies: {
              "pkg-1": "^1.0.0",
            },
          },
          "/test/pkg-2"
        ),
        new Package(
          {
            name: "pkg-3",
            version: "3.0.0",
            dependencies: {
              "pkg-2": "^2.0.0",
            },
          },
          "/test/pkg-3"
        ),
      ];
      const graph = new PackageGraph(pkgs);

      // deepInspect(graph);
      expect(graph.get("pkg-1").externalDependencies.has("pkg-2")).toBe(true);
      expect(graph.get("pkg-2").localDependents.has("pkg-1")).toBe(false);
      expect(graph.get("pkg-2").localDependencies.has("pkg-1")).toBe(true);
      expect(graph.get("pkg-3").localDependencies.has("pkg-2")).toBe(true);
    });

    it("localizes all non-satisfied siblings when forced", () => {
      const pkgs = [
        new Package(
          {
            name: "pkg-1",
            version: "1.0.0",
          },
          "/test/pkg-1"
        ),
        new Package(
          {
            name: "pkg-2",
            version: "2.0.0",
            dependencies: {
              // non-circular external
              "pkg-1": "^2.0.0",
            },
          },
          "/test/pkg-2"
        ),
      ];
      const graph = new PackageGraph(pkgs, "allDependencies", true);
      // deepInspect(graph);
      const [pkg1, pkg2] = graph.values();

      expect(pkg1.localDependents.has("pkg-2")).toBe(true);
      expect(pkg2.localDependencies.has("pkg-1")).toBe(true);
    });

    describe("with spec containing workspace: prefix", () => {
      describe("without depNode for sibling package", () => {
        it("replaces workspace alias ~ with * and adds sibling to external dependencies", () => {
          const packages = [
            new Package(
              {
                name: "test-2",
                version: "1.0.0",
                dependencies: {
                  "test-1": "workspace:~",
                },
              },
              "/test/test-2"
            ),
          ];
          const graph = new PackageGraph(packages, "allDependencies");
          const package2 = graph.get("test-2");

          expect(package2.externalDependencies.has("test-1")).toBe(true);
          expect(package2.externalDependencies.get("test-1").workspaceSpec).toBe("workspace:~");
          expect(package2.externalDependencies.get("test-1").workspaceAlias).toBe("~");
        });

        it("replaces workspace alias * with * and adds sibling to external dependencies", () => {
          const packages = [
            new Package(
              {
                name: "test-2",
                version: "1.0.0",
                dependencies: {
                  "test-1": "workspace:*",
                },
              },
              "/test/test-2"
            ),
          ];
          const graph = new PackageGraph(packages, "allDependencies");
          const package2 = graph.get("test-2");

          expect(package2.externalDependencies.has("test-1")).toBe(true);
          expect(package2.externalDependencies.get("test-1").workspaceSpec).toBe("workspace:*");
          expect(package2.externalDependencies.get("test-1").workspaceAlias).toBe("*");
        });

        it("replaces workspace alias ^ with * and adds sibling to external dependencies", () => {
          const packages = [
            new Package(
              {
                name: "test-2",
                version: "1.0.0",
                dependencies: {
                  "test-1": "workspace:^",
                },
              },
              "/test/test-2"
            ),
          ];
          const graph = new PackageGraph(packages, "allDependencies");
          const package2 = graph.get("test-2");

          expect(package2.externalDependencies.has("test-1")).toBe(true);
          expect(package2.externalDependencies.get("test-1").workspaceSpec).toBe("workspace:^");
          expect(package2.externalDependencies.get("test-1").workspaceAlias).toBe("^");
        });
      });

      describe("creates graph links for sibling package when semver is satisfied", () => {
        it("with exact match", () => {
          const packages = [
            new Package(
              {
                name: "test-1",
                version: "1.0.2",
              },
              "/test/test-1"
            ),
            new Package(
              {
                name: "test-2",
                version: "1.0.0",
                dependencies: {
                  "test-1": "workspace:1.0.2",
                },
              },
              "/test/test-2"
            ),
          ];
          const graph = new PackageGraph(packages, "allDependencies");
          const package1 = graph.get("test-1");
          const package2 = graph.get("test-2");

          expect(package1.localDependents.has("test-2")).toBe(true);
          expect(package2.localDependencies.has("test-1")).toBe(true);
          expect(package2.localDependencies.get("test-1").workspaceSpec).toBe("workspace:1.0.2");
          expect(package2.localDependencies.get("test-1").workspaceAlias).toBeUndefined();
        });

        it("with ^", () => {
          const packages = [
            new Package(
              {
                name: "test-1",
                version: "1.1.2",
              },
              "/test/test-1"
            ),
            new Package(
              {
                name: "test-2",
                version: "1.0.0",
                dependencies: {
                  "test-1": "workspace:^1.0.0",
                },
              },
              "/test/test-2"
            ),
          ];
          const graph = new PackageGraph(packages, "allDependencies");
          const package1 = graph.get("test-1");
          const package2 = graph.get("test-2");

          expect(package1.localDependents.has("test-2")).toBe(true);
          expect(package2.localDependencies.has("test-1")).toBe(true);
          expect(package2.localDependencies.get("test-1").workspaceSpec).toBe("workspace:^1.0.0");
          expect(package2.localDependencies.get("test-1").workspaceAlias).toBeUndefined();
        });

        it("with ~", () => {
          const packages = [
            new Package(
              {
                name: "test-1",
                version: "1.1.2",
              },
              "/test/test-1"
            ),
            new Package(
              {
                name: "test-2",
                version: "1.0.0",
                dependencies: {
                  "test-1": "workspace:~1.1.0",
                },
              },
              "/test/test-2"
            ),
          ];
          const graph = new PackageGraph(packages, "allDependencies");
          const package1 = graph.get("test-1");
          const package2 = graph.get("test-2");

          expect(package1.localDependents.has("test-2")).toBe(true);
          expect(package2.localDependencies.has("test-1")).toBe(true);
          expect(package2.localDependencies.get("test-1").workspaceSpec).toBe("workspace:~1.1.0");
          expect(package2.localDependencies.get("test-1").workspaceAlias).toBeUndefined();
        });
      });

      it("creates graph links for sibling package when using * alias", () => {
        const packages = [
          new Package(
            {
              name: "test-1",
              version: "1.0.0",
            },
            "/test/test-1"
          ),
          new Package(
            {
              name: "test-2",
              version: "1.0.0",
              dependencies: {
                "test-1": "workspace:*",
              },
            },
            "/test/test-2"
          ),
        ];
        const graph = new PackageGraph(packages, "allDependencies");
        const package1 = graph.get("test-1");
        const package2 = graph.get("test-2");

        expect(package1.localDependents.has("test-2")).toBe(true);
        expect(package2.localDependencies.has("test-1")).toBe(true);
        expect(package2.localDependencies.get("test-1").workspaceSpec).toBe("workspace:*");
        expect(package2.localDependencies.get("test-1").workspaceAlias).toBe("*");
      });

      it("creates graph links for sibling package when using ~ alias", () => {
        const packages = [
          new Package(
            {
              name: "test-1",
              version: "1.0.0",
            },
            "/test/test-1"
          ),
          new Package(
            {
              name: "test-2",
              version: "1.0.0",
              dependencies: {
                "test-1": "workspace:~",
              },
            },
            "/test/test-2"
          ),
        ];
        const graph = new PackageGraph(packages, "allDependencies");
        const package1 = graph.get("test-1");
        const package2 = graph.get("test-2");

        expect(package1.localDependents.has("test-2")).toBe(true);
        expect(package2.localDependencies.has("test-1")).toBe(true);
        expect(package2.localDependencies.get("test-1").workspaceSpec).toBe("workspace:~");
        expect(package2.localDependencies.get("test-1").workspaceAlias).toBe("~");
      });

      it("creates graph links for sibling package when using ^ alias", () => {
        const packages = [
          new Package(
            {
              name: "test-1",
              version: "1.0.0",
            },
            "/test/test-1"
          ),
          new Package(
            {
              name: "test-2",
              version: "1.0.0",
              dependencies: {
                "test-1": "workspace:^",
              },
            },
            "/test/test-2"
          ),
        ];
        const graph = new PackageGraph(packages, "allDependencies");
        const package1 = graph.get("test-1");
        const package2 = graph.get("test-2");

        expect(package1.localDependents.has("test-2")).toBe(true);
        expect(package2.localDependencies.has("test-1")).toBe(true);
        expect(package2.localDependencies.get("test-1").workspaceSpec).toBe("workspace:^");
        expect(package2.localDependencies.get("test-1").workspaceAlias).toBe("^");
      });

      it("throws an error when sibling package exists in the workspace, but with a version that does not match the specification", () => {
        const packages = [
          new Package(
            {
              name: "test-1",
              version: "1.0.9",
            },
            "/test/test-1"
          ),
          new Package(
            {
              name: "test-2",
              version: "1.0.0",
              dependencies: {
                "test-1": "workspace:^1.1.0",
              },
            },
            "/test/test-2"
          ),
        ];
        expect(() => new PackageGraph(packages)).toThrowErrorMatchingInlineSnapshot(
          `"Package specification \\"test-1@^1.1.0\\" could not be resolved within the workspace. To reference a non-matching, remote version of a local dependency, remove the 'workspace:' prefix."`
        );
      });
    });
  });

  describe("Node", () => {
    it("proxies Package properties", () => {
      const pkg = new Package({ name: "my-pkg", version: "1.2.3" }, "/path/to/my-pkg");
      const graph = new PackageGraph([pkg]);
      const node = graph.get("my-pkg");

      // most of these properties are non-enumerable, so a snapshot doesn't work
      expect(node.name).toBe("my-pkg");
      expect(node.location).toBe("/path/to/my-pkg");
      expect(node.prereleaseId).toBeUndefined();
      expect(node.version).toBe("1.2.3");
      expect(node.pkg).toBe(pkg);
    });

    it("exposes graph-specific Map properties", () => {
      const node = new PackageGraph([
        new Package({ name: "my-pkg", version: "4.5.6" }, "/path/to/my-pkg"),
      ]).get("my-pkg");

      expect(node).toHaveProperty("externalDependencies", expect.any(Map));
      expect(node).toHaveProperty("localDependencies", expect.any(Map));
      expect(node).toHaveProperty("localDependents", expect.any(Map));
    });

    it("computes prereleaseId from prerelease version", () => {
      const node = new PackageGraph([
        new Package({ name: "my-pkg", version: "1.2.3-rc.4" }, "/path/to/my-pkg"),
      ]).get("my-pkg");

      expect(node.prereleaseId).toBe("rc");
    });

    describe(".toString()", () => {
      it("returns the node's name", () => {
        const node = new PackageGraph([
          new Package({ name: "pkg-name", version: "0.1.2" }, "/path/to/pkg-name"),
        ]).get("pkg-name");

        expect(node.toString()).toBe("pkg-name");
      });
    });
  });

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
      const graph = new PackageGraph(packages, "allDependencies");

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
      const graph = new PackageGraph(packages, "dependencies");

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
      const graph = new PackageGraph(packages);

      expect(graph.get("my-package-2").localDependencies.has("my-package-1")).toBe(true);
    });
  });

  describe(".rawPackageList", () => {
    it("returns an array of Package instances", () => {
      const pkgs = [
        new Package({ name: "pkg-1", version: "1.0.0" }, "/test/pkg-1", "/test"),
        new Package({ name: "pkg-2", version: "2.0.0" }, "/test/pkg-2", "/test"),
      ];
      const graph = new PackageGraph(pkgs);

      expect(graph.rawPackageList).toEqual(pkgs);
    });
  });

  describe.each`
    method               | filtered     | expected
    ${"addDependencies"} | ${["pkg-a"]} | ${["pkg-a", "pkg-b"]}
    ${"addDependents"}   | ${["pkg-d"]} | ${["pkg-d", "pkg-c"]}
  `(".$method()", ({ method, filtered, expected }) => {
    it(`extends ${filtered} to ${expected}`, () => {
      const pkgs = [
        { name: "pkg-a", version: "1.0.0", dependencies: { "pkg-b": "1.0.0" } },
        { name: "pkg-b", version: "1.0.0", dependencies: {} },
        { name: "pkg-c", version: "1.0.0", dependencies: { "pkg-d": "1.0.0" } },
        { name: "pkg-d", version: "1.0.0", dependencies: { "pkg-c": "1.0.0" } },
        // cycle c <-> d catches nested search.add()
      ].map((json) => new Package(json, `/test/${json.name}`, "/test"));
      const graph = new PackageGraph(pkgs);

      const search = filtered.map((name) => graph.get(name).pkg);
      const result = graph[method](search);

      expect(result.map((pkg) => pkg.name)).toEqual(expected);
    });
  });

  describe(".partitionCycles()", () => {
    it("does not mutate a graph with no cycles", () => {
      const pkgs = [
        new Package(
          {
            name: "pkg-1",
            version: "1.0.0",
          },
          "/test/pkg-1"
        ),
        new Package(
          {
            name: "pkg-2",
            version: "2.0.0",
            dependencies: {
              "pkg-1": "^1.0.0",
            },
          },
          "/test/pkg-2"
        ),
      ];
      const graph = new PackageGraph(pkgs);
      // deepInspect(graph);
      const [paths, nodes] = graph.partitionCycles();

      expect(graph.size).toBe(2);
      expect(paths.size).toBe(0);
      expect(nodes.size).toBe(0);
    });
  });

  describe(".pruneCycleNodes()", () => {
    it("prunes direct cycles from the graph", () => {
      const pkgs = [
        new Package(
          {
            name: "pkg-1",
            version: "1.0.0",
            dependencies: {
              "pkg-2": "^2.0.0",
            },
          },
          "/test/pkg-1"
        ),
        new Package(
          {
            name: "pkg-2",
            version: "2.0.0",
            dependencies: {
              "pkg-1": "^1.0.0",
            },
          },
          "/test/pkg-2"
        ),
      ];
      const graph = new PackageGraph(pkgs);
      // deepInspect(graph);
      const [paths, nodes] = graph.partitionCycles();
      graph.pruneCycleNodes(nodes);
      // deepInspect(nodes);

      expect(graph.size).toBe(0);
      expect(nodes.size).toBe(2);
      expect(paths).toMatchInlineSnapshot(`
Set {
  Array [
    "pkg-1",
    "pkg-2",
    "pkg-1",
  ],
  Array [
    "pkg-2",
    "pkg-1",
    "pkg-2",
  ],
}
`);
    });

    it("prunes all cycles from the graph, retaining non-cycles", () => {
      const pkgs = topoPackages();
      const graph = new PackageGraph(pkgs);
      // deepInspect(graph);
      const [paths, nodes] = graph.partitionCycles();
      graph.pruneCycleNodes(nodes);
      // deepInspect(graph);
      // deepInspect(nodes);

      expect(Array.from(graph.keys())).toMatchInlineSnapshot(`
Array [
  "dag-1",
  "dag-2a",
  "dag-2b",
  "dag-3",
  "standalone",
]
`);
      expect(Array.from(nodes.keys()).map((node) => node.name)).toMatchInlineSnapshot(`
Array [
  "cycle-1",
  "cycle-2",
  "cycle-tiebreaker",
]
`);
      expect(paths).toMatchInlineSnapshot(`
Set {
  Array [
    "cycle-1",
    "cycle-2",
    "cycle-1",
  ],
  Array [
    "cycle-2",
    "cycle-1",
    "cycle-2",
  ],
  Array [
    "cycle-tiebreaker",
    "cycle-1",
    "cycle-2",
    "cycle-1",
  ],
}
`);
    });
  });
});

function topoPackages() {
  return [
    {
      name: "cycle-1",
      version: "1.0.0",
      dependencies: {
        "cycle-2": "1.0.0",
      },
    },
    {
      name: "cycle-2",
      version: "1.0.0",
      dependencies: {
        "cycle-1": "1.0.0",
      },
    },
    {
      name: "cycle-tiebreaker",
      version: "1.0.0",
      description: "Breaks ties between cycle-{1,2} when batching.",
      dependencies: {
        "cycle-1": "1.0.0",
      },
    },
    {
      name: "dag-1",
      version: "1.0.0",
    },
    {
      name: "dag-2a",
      version: "1.0.0",
      dependencies: {
        "dag-1": "1.0.0",
      },
    },
    {
      name: "dag-2b",
      version: "1.0.0",
      dependencies: {
        "dag-1": "1.0.0",
      },
    },
    {
      name: "dag-3",
      version: "1.0.0",
      dependencies: {
        "dag-2a": "1.0.0",
        "dag-1": "1.0.0",
      },
    },
    {
      name: "standalone",
      version: "1.0.0",
    },
  ].map((json) => new Package(json, `/test/${json.name}`, "/test"));
}
