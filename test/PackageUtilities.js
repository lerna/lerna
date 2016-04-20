import assert from "assert";
import path from "path";

import PackageUtilities from "../src/PackageUtilities";
import Package from "../src/Package";

describe("PackageUtilities", () => {
  describe(".getPackagesPath()", () => {
    it("should append the packages path to the repo path given", () => {
      assert.equal(
        PackageUtilities.getPackagesPath("/path/to/repo"),
        "/path/to/repo/packages"
      );
    });
  });

  describe(".getPackagePath()", () => {
    it("should append the package path to the packages path given", () => {
      assert.equal(
        PackageUtilities.getPackagePath("/path/to/repo/packages", "my-package"),
        "/path/to/repo/packages/my-package"
      );
    });
  });

  describe(".getPackageConfigPath()", () => {
    it("should append the package config path to the packages path given", () => {
      assert.equal(
        PackageUtilities.getPackageConfigPath("/path/to/repo/packages", "my-package"),
        "/path/to/repo/packages/my-package/package.json"
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
});
