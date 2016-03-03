var assert = require("assert");
var path   = require("path");

var lerna = require("../index");

describe("Lerna public api", function() {
  it("getPackagesPath", function() {
    assert.equal(
      lerna.getPackagesPath("/path/to/repo"),
      "/path/to/repo/packages"
    );
  });

  it("getPackagePath", function() {
    assert.equal(
      lerna.getPackagePath("/path/to/repo/packages", "my-package"),
      "/path/to/repo/packages/my-package"
    );
  });

  it("getPackageConfigPath", function() {
    assert.equal(
      lerna.getPackageConfigPath("/path/to/repo/packages", "my-package"),
      "/path/to/repo/packages/my-package/package.json"
    );
  });

  it("getPackageConfig", function() {
    var fixture = path.join(__dirname, "fixtures/basic/packages");

    assert.deepEqual(
      lerna.getPackageConfig(fixture, "my-package"),
      {
        name: "my-package",
        version: "1.0.0"
      }
    );
  });

  it("getPackages", function() {
    var fixture = path.join(__dirname, "fixtures/basic/packages");

    assert.deepEqual(
      lerna.getPackages(fixture),
      [{
        folder: "my-package",
        loc: path.join(fixture, "my-package/package.json"),
        name: "my-package",
        pkg: {
          name: "my-package",
          version: "1.0.0"
        },
        version: "1.0.0"
      }]
    );
  });
});
