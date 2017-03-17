import assert from "assert";
import path from "path";

import PackageUtilities from "../src/PackageUtilities";
import Package from "../src/Package";
import Repository from "../src/Repository";
import initFixture from "./helpers/initFixture";

describe("PackageUtilities", () => {
  describe("public API", () => {
    let testDir;

    beforeEach(() => initFixture("PackageUtilities/basic").then((dir) => {
      testDir = dir;
    }));

    describe(".getPackagesPath()", () => {
      it("should append the packages path to the repo path given", () => {
        assert.equal(
          PackageUtilities.getPackagesPath("/path/to/repo"),
          path.join("/path/to/repo/packages")
        );
      });
    });

    describe(".getPackagePath()", () => {
      it("should append the package path to the packages path given", () => {
        assert.equal(
          PackageUtilities.getPackagePath("/path/to/repo/packages", "my-package"),
          path.join("/path/to/repo/packages/my-package")
        );
      });
    });

    describe(".getPackageConfigPath()", () => {
      it("should append the package config path to the packages path given", () => {
        assert.equal(
          PackageUtilities.getPackageConfigPath("/path/to/repo/packages", "my-package"),
          path.join("/path/to/repo/packages/my-package/package.json")
        );
      });
    });

    describe(".getPackageConfig()", () => {
      it("should get the config file for the given package in the given packages directory", () => {
        const fixture = path.join(testDir, "packages");

        assert.deepEqual(
          PackageUtilities.getPackageConfig(fixture, "package-1"),
          {
            name: "package-1",
            version: "1.0.0"
          }
        );
      });
    });

    describe(".getPackages()", () => {
      it("should collect all the packages from the given packages directory", () => {
        const fixture = path.join(testDir, "packages");
        const result = PackageUtilities.getPackages(new Repository);

        assert.equal(result.length, 4);
        assert(result[0] instanceof Package);
        assert.equal(result[0].name, "package-1");
        assert.equal(result[0].version, "1.0.0");
        assert.equal(result[0].location, path.join(fixture, "package-1"));
      });
    });
  });

  describe(".filterPackages()", () => {
    let packages;

    beforeEach(() => initFixture("PackageUtilities/filtering").then(() => {
      packages = PackageUtilities.getPackages(new Repository);
    }));

    it("includes all packages when --scope is omitted", () => {
      const flags = {
        // scope: undefined
      };
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, flags).map((pkg) => pkg.name),
        ["package-3", "package-4", "package-a-1", "package-a-2"]
      );
    });

    it("includes all packages when --scope is boolean", () => {
      const flags = {
        scope: true, // --scope
      };
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, flags).map((pkg) => pkg.name),
        ["package-3", "package-4", "package-a-1", "package-a-2"]
      );
    });

    it("includes packages when --scope is a package name", () => {
      const flags = {
        scope: "package-3",
      };
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, flags).map((pkg) => pkg.name),
        ["package-3"]
      );
    });

    it("excludes packages when --ignore is a package name", () => {
      const flags = {
        ignore: "package-3",
      };
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, flags).map((pkg) => pkg.name),
        ["package-4", "package-a-1", "package-a-2"]
      );
    });

    it("includes packages when --scope is a glob", () => {
      const flags = {
        scope: "package-a-*",
      };
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, flags).map((pkg) => pkg.name),
        ["package-a-1", "package-a-2"]
      );
    });

    it("excludes packages when --ignore is a glob", () => {
      const flags = {
        ignore: "package-@(2|3|4)",
      };
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, flags).map((pkg) => pkg.name),
        ["package-a-1", "package-a-2"]
      );
    });

    it("excludes packages when --ignore is a brace-expanded list", () => {
      /* NOTE: ignore value is array at this point if option is "package-{3,4}" */
      const flags = {
        ignore: ["package-3", "package-4"],
      };
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, flags).map((pkg) => pkg.name),
        ["package-a-1", "package-a-2"]
      );
    });

    it("filters packages when both --scope and --ignore are passed", () => {
      const flags = {
        scope: "package-a-*",
        ignore: "package-a-2",
      };
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, flags).map((pkg) => pkg.name),
        ["package-a-1"]
      );
    });

    it("should throw when --scope glob excludes all packages", () => {
      const flags = {
        scope: "no-package-*",
      };
      assert.throws(() => {
        PackageUtilities.filterPackages(packages, flags);
      });
    });

    it("should throw when --scope and --ignore globs exclude all packages", () => {
      const flags = {
        scope: "package-a-*",
        ignore: "package-a-@(1|2)",
      };
      assert.throws(() => {
        PackageUtilities.filterPackages(packages, flags);
      });
    });
  });

  describe(".topologicallyBatchPackages()", () => {
    let packages;

    beforeEach(() => initFixture("PackageUtilities/toposort").then(() => {
      packages = PackageUtilities.getPackages(new Repository);
    }));

    it("should batch roots, then internal/leaf nodes, then cycles", () => {
      assert.deepEqual(
        PackageUtilities.topologicallyBatchPackages(packages).map((batch) => batch.map((pkg) => pkg.name)),
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
    const batches = [
      [ 1 ],
      [ 2, 3 ],
      [ 4, 5, 6 ],
      [ 7, 8, 9, 10 ]
    ];

    const taskOrdering = [];

    // Array#sort sorts numbers lexicographically by default!
    function numericalSort(a, b) {
      return a - b;
    }

    it("should run batches serially", (done) => {
      PackageUtilities.runParallelBatches(batches, (n) => (cb) => {
        taskOrdering.push(n);
        cb();
      }, 1, (err) => {
        assert(!err);
        assert.equal(taskOrdering.length, 10);
        assert.deepEqual([
          taskOrdering.slice(0, 1).sort(numericalSort),
          taskOrdering.slice(1, 3).sort(numericalSort),
          taskOrdering.slice(3, 6).sort(numericalSort),
          taskOrdering.slice(6, 10).sort(numericalSort)
        ], batches);
        done();
      });
    });
  });
});
