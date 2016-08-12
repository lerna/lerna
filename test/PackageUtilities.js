import assert from "assert";
import path from "path";

import PackageUtilities from "../src/PackageUtilities";
import Package from "../src/Package";

describe("PackageUtilities", () => {
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
      const fixture = path.join(__dirname, "fixtures/PackageUtilities/basic/packages");

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
      const fixture = path.join(__dirname, "fixtures/PackageUtilities/basic/packages");
      const result = PackageUtilities.getPackages(fixture);

      assert.equal(result.length, 4);
      assert(result[0] instanceof Package);
      assert.equal(result[0].name, "package-1");
      assert.equal(result[0].version, "1.0.0");
      assert.equal(result[0].location, path.join(fixture, "package-1"));
    });
  });

  describe(".filterPackages()", () => {
    const fixture = path.join(__dirname, "fixtures/PackageUtilities/filtering/packages");
    const packages = PackageUtilities.getPackages(fixture);

    it("should throw when --scope is given but empty", () => {
      assert.throws(() => {
        PackageUtilities.filterPackages(packages, "");
      });
    });

    it("should throw when --scope is given but excludes all packages", () => {
      assert.throws(() => {
        PackageUtilities.filterPackages(packages, "no-matchy");
      });
    });

    it("should properly restrict the package scope", () => {
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, "package-3").map((pkg) => pkg.name),
        ["package-3"]
      );
    });

    it("should properly restrict the package scope with a glob", () => {
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, "package-a-*").map((pkg) => pkg.name),
        ["package-a-1", "package-a-2"]
      );
    });

    it("should properly filter packages by negating the glob", () => {
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, "package-3", true).map((pkg) => pkg.name),
        ["package-4", "package-a-1", "package-a-2"]
      );
      assert.deepEqual(
        PackageUtilities.filterPackages(packages, "package-a-?", true).map((pkg) => pkg.name),
        ["package-3", "package-4"]
      );
    });
  });

});
