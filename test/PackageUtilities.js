import log from "npmlog";
import path from "path";

// tightly-coupled modules; TODO: decouple
import Package from "../src/Package";
import Repository from "../src/Repository";

// helpers
import initFixture from "./helpers/initFixture";

// file under test
import PackageUtilities from "../src/PackageUtilities";

// silence logs
log.level = "silent";

describe("PackageUtilities", () => {
  describe(".getPackages()", () => {
    it("should collect all the packages from the given packages directory", async () => {
      const testDir = await initFixture("PackageUtilities/basic");
      const result = PackageUtilities.getPackages(new Repository(testDir));
      expect(result).toHaveLength(4);

      const pkgOne = result[0];
      expect(pkgOne).toBeInstanceOf(Package);
      expect(pkgOne.name).toBe("package-1");
      expect(pkgOne.version).toBe("1.0.0");
      expect(pkgOne.location).toBe(path.join(testDir, "packages", "package-1"));
    });

    it("finds nested packages with globstar", async () => {
      const testDir = await initFixture("PackageUtilities/globstar");
      const result = PackageUtilities.getPackages(new Repository(testDir));
      expect(result.map((pkg) => pkg.name)).toEqual([
        "globstar-monorepo",
        "package-2",
        "package-4",
        "package-1",
        "package-3",
        "package-5",
      ]);
    });

    it("does not ignore explicit node_modules in packages config", async () => {
      const testDir = await initFixture("PackageUtilities/explicit-node-modules");
      const result = PackageUtilities.getPackages(new Repository(testDir));
      expect(result.map((pkg) => pkg.name)).toEqual([
        "alle-pattern-monorepo",
        "package-1",
        "package-2",
        "package-3",
        "package-4",
        "@scoped/package-5",
      ]);
    });

    it("throws an error when globstars and explicit node_modules configs are mixed", async () => {
      const testDir = await initFixture("PackageUtilities/mixed-globstar");
      try {
        PackageUtilities.getPackages(new Repository(testDir));
      } catch (err) {
        expect(err.message).toMatch("An explicit node_modules package path does not allow globstars");
      }
    });
  });

  describe(".filterPackages()", () => {
    let packages;

    beforeAll(() => initFixture("PackageUtilities/filtering").then((testDir) => {
      packages = PackageUtilities.getPackages(new Repository(testDir));
    }));

    it("includes all packages when --scope is omitted", () => {
      const flags = {
        // scope: undefined
      };
      const result = PackageUtilities.filterPackages(packages, flags);
      expect(result.map((pkg) => pkg.name)).toEqual(
        ["package-3", "package-4", "package-a-1", "package-a-2"]
      );
    });

    it("includes all packages when --scope is boolean", () => {
      const flags = {
        scope: true, // --scope
      };
      const result = PackageUtilities.filterPackages(packages, flags);
      expect(result.map((pkg) => pkg.name)).toEqual(
        ["package-3", "package-4", "package-a-1", "package-a-2"]
      );
    });

    it("includes packages when --scope is a package name", () => {
      const flags = {
        scope: "package-3",
      };
      const result = PackageUtilities.filterPackages(packages, flags);
      expect(result.map((pkg) => pkg.name)).toEqual(
        ["package-3"]
      );
    });

    it("excludes packages when --ignore is a package name", () => {
      const flags = {
        ignore: "package-3",
      };
      const result = PackageUtilities.filterPackages(packages, flags);
      expect(result.map((pkg) => pkg.name)).toEqual(
        ["package-4", "package-a-1", "package-a-2"]
      );
    });

    it("includes packages when --scope is a glob", () => {
      const flags = {
        scope: "package-a-*",
      };
      const result = PackageUtilities.filterPackages(packages, flags);
      expect(result.map((pkg) => pkg.name)).toEqual(
        ["package-a-1", "package-a-2"]
      );
    });

    it("excludes packages when --ignore is a glob", () => {
      const flags = {
        ignore: "package-@(2|3|4)",
      };
      const result = PackageUtilities.filterPackages(packages, flags);
      expect(result.map((pkg) => pkg.name)).toEqual(
        ["package-a-1", "package-a-2"]
      );
    });

    it("excludes packages when --ignore is a brace-expanded list", () => {
      /* NOTE: ignore value is array at this point if option is "package-{3,4}" */
      const flags = {
        ignore: ["package-3", "package-4"],
      };
      const result = PackageUtilities.filterPackages(packages, flags);
      expect(result.map((pkg) => pkg.name)).toEqual(
        ["package-a-1", "package-a-2"]
      );
    });

    it("filters packages when both --scope and --ignore are passed", () => {
      const flags = {
        scope: "package-a-*",
        ignore: "package-a-2",
      };
      const result = PackageUtilities.filterPackages(packages, flags);
      expect(result.map((pkg) => pkg.name)).toEqual(
        ["package-a-1"]
      );
    });

    it("should throw when --scope glob excludes all packages", () => {
      const flags = {
        scope: "no-package-*",
      };
      expect(() => {
        PackageUtilities.filterPackages(packages, flags);
      }).toThrow();
    });

    it("should throw when --ignore glob excludes all packages", () => {
      const flags = {
        ignore: "package-*",
      };
      expect(() => {
        PackageUtilities.filterPackages(packages, flags);
      }).toThrow();
    });

    it("should throw when --scope and --ignore globs exclude all packages", () => {
      const flags = {
        scope: "package-a-*",
        ignore: "package-a-@(1|2)",
      };
      expect(() => {
        PackageUtilities.filterPackages(packages, flags);
      }).toThrow();
    });
  });

  describe(".topologicallyBatchPackages()", () => {
    let packages;

    beforeEach(() => initFixture("PackageUtilities/toposort").then((testDir) => {
      packages = PackageUtilities.getPackages(new Repository(testDir));
    }));

    it("should batch roots, then internal/leaf nodes, then cycles", () => {
      let warnedCycle;
      log.once("log.warn", () => {
        warnedCycle = true;
      });

      const batchedPackages = PackageUtilities.topologicallyBatchPackages(packages);

      expect(warnedCycle).toBe(true);
      expect(batchedPackages.map((batch) => batch.map((pkg) => pkg.name))).toEqual(
        [
          ["package-dag-1", "package-standalone"],
          ["package-dag-2a", "package-dag-2b"],
          ["package-dag-3"],
          ["package-cycle-1"],
          ["package-cycle-2", "package-cycle-extraneous"]
        ]
      );
    });
  });

  describe(".runParallelBatches()", () => {
    // Array#sort sorts numbers lexicographically by default!
    function numericalSort(a, b) {
      return a - b;
    }

    it("should run batches serially", (done) => {
      const batches = [
        [ 1 ],
        [ 2, 3 ],
        [ 4, 5, 6 ],
        [ 7, 8, 9, 10 ]
      ];

      const taskOrdering = [];

      PackageUtilities.runParallelBatches(batches, (n) => (cb) => {
        taskOrdering.push(n);
        cb();
      }, 1, (err) => {
        if (err) return done.fail(err);

        try {
          expect(taskOrdering).toHaveLength(10);
          expect([
            taskOrdering.slice(0, 1).sort(numericalSort),
            taskOrdering.slice(1, 3).sort(numericalSort),
            taskOrdering.slice(3, 6).sort(numericalSort),
            taskOrdering.slice(6, 10).sort(numericalSort)
          ]).toEqual(batches);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });
});
